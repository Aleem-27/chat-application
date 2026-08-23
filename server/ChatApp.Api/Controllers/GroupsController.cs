using System.IdentityModel.Tokens.Jwt;
using ChatApp.Api.Data;
using ChatApp.Api.DTOs;
using ChatApp.Api.Models;
using ChatApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
  private readonly AppDbContext _db;
  private readonly IUserConnectionTracker _connectionTracker;

  public GroupsController(AppDbContext db, IUserConnectionTracker connectionTracker)
  {
    _db = db;
    _connectionTracker = connectionTracker;
  }

  private string UserId => User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value;

  [HttpPost]
  public async Task<IActionResult> CreateGroup(CreateGroupDTO dto)
  {
    var group = new Group
    {
      Name = dto.Name,
      IsDirectMessage = false,
      CreatedByUserId = UserId
    };

    group.Members.Add(new GroupMember
    {
      UserId = UserId,
      Role = GroupMemberRole.Admin
    });

    _db.Groups.Add(group);
    await _db.SaveChangesAsync();

    return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, await BuildGroupResponse(group.Id));
  }

  [HttpPost("direct")]
  public async Task<IActionResult> GetOrCreateDirectMessage(CreateDirectMessageDTO dto)
  {
    if (dto.TargetUserId == UserId)
    {
      return BadRequest(new { message = "Cannot start a direct message with yourself." });
    }

    var isFriend = await _db.Friendships.AnyAsync(f =>
        f.Status == FriendshipStatus.Accepted &&
        ((f.RequesterId == UserId && f.AddresseeId == dto.TargetUserId) ||
        (f.RequesterId == dto.TargetUserId && f.AddresseeId == UserId)));

    if (!isFriend)
    {
      return Forbid();
    }

    var targetExists = await _db.Users.AnyAsync(u => u.Id == dto.TargetUserId);
    if (!targetExists)
    {
      return NotFound(new { message = "Target user not found." });
    }

    var existingGroupId = await FindExistingDirectMessageGroupId(UserId, dto.TargetUserId);
    if (existingGroupId is not null)
    {
      var membership = await _db.GroupMembers
          .FirstOrDefaultAsync(gm => gm.GroupId == existingGroupId && gm.UserId == UserId);

      if (membership is not null && membership.IsHidden)
      {
        membership.IsHidden = false;
        await _db.SaveChangesAsync();
      }

      return Ok(await BuildGroupResponse(existingGroupId.Value));
    }

    var group = new Group
    {
      Name = "Direct Message",
      IsDirectMessage = true,
      CreatedByUserId = UserId
    };

    group.Members.Add(new GroupMember { UserId = UserId, Role = GroupMemberRole.Member });
    group.Members.Add(new GroupMember { UserId = dto.TargetUserId, Role = GroupMemberRole.Member });

    _db.Groups.Add(group);
    await _db.SaveChangesAsync();

    return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, await BuildGroupResponse(group.Id));
  }

  [HttpGet]
  public async Task<IActionResult> GetMyGroups()
  {
    var groupIds = await _db.GroupMembers
        .Where(gm => gm.UserId == UserId && !gm.IsHidden)
        .Select(gm => gm.GroupId)
        .ToListAsync();

    var groups = new List<GroupResponseDTO>();
    foreach (var groupId in groupIds)
    {
      groups.Add(await BuildGroupResponse(groupId));
    }

    return Ok(groups);
  }

  [HttpGet("{id}")]
  public async Task<IActionResult> GetGroup(int id)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (!isMember)
    {
      return Forbid();
    }

    return Ok(await BuildGroupResponse(id));
  }

  private async Task<int?> FindExistingDirectMessageGroupId(string userIdA, string userIdB)
  {
    var candidateGroupIds = await _db.GroupMembers
        .Where(gm => gm.Group.IsDirectMessage && gm.UserId == userIdA)
        .Select(gm => gm.GroupId)
        .ToListAsync();

    foreach (var groupId in candidateGroupIds)
    {
      var memberIds = await _db.GroupMembers
          .Where(gm => gm.GroupId == groupId)
          .Select(gm => gm.UserId)
          .ToListAsync();

      if (memberIds.Count == 2 && memberIds.Contains(userIdB))
      {
        return groupId;
      }
    }

    return null;
  }

  private async Task<HashSet<string>> GetFriendUserIdsAsync()
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == UserId || f.AddresseeId == UserId))
        .ToListAsync();

    return friendships.Select(f => f.RequesterId == UserId ? f.AddresseeId : f.RequesterId).ToHashSet();
  }

  private async Task<GroupResponseDTO> BuildGroupResponse(int groupId)
  {
    var group = await _db.Groups.FirstAsync(g => g.Id == groupId);
    var friendIds = await GetFriendUserIdsAsync();

    var members = await _db.GroupMembers
        .Where(gm => gm.GroupId == groupId)
        .Include(gm => gm.User)
        .Select(gm => new GroupMemberResponseDTO
        {
          UserId = gm.UserId,
          DisplayName = gm.User.DisplayName,
          AvatarUrl = gm.User.AvatarUrl,
          Role = gm.Role,
          IsOnline = false
        })
        .ToListAsync();

    var onlineIds = _connectionTracker.GetOnlineUserIds();
    foreach (var member in members)
    {
      member.IsOnline = friendIds.Contains(member.UserId) && onlineIds.Contains(member.UserId);
    }

    var lastMessage = await _db.Messages
        .Where(m => m.GroupId == groupId)
        .OrderByDescending(m => m.SentAt)
        .Select(m => new LastMessagePreviewDTO
        {
          SenderId = m.SenderId,
          SenderDisplayName = m.Sender.DisplayName,
          Content = m.Content,
          HasFile = m.FileUrl != null,
          FileName = m.FileName,
          IsDeleted = m.IsDeleted,
          SentAt = m.SentAt
        })
        .FirstOrDefaultAsync();

    return new GroupResponseDTO
    {
      Id = group.Id,
      Name = group.Name,
      IsDirectMessage = group.IsDirectMessage,
      CreatedAt = group.CreatedAt,
      Members = members,
      LastMessageAt = lastMessage?.SentAt,
      LastMessage = lastMessage
    };
  }

  [HttpPost("{id}/hide")]
  public async Task<IActionResult> HideGroup(int id)
  {
    var membership = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (membership is null)
    {
      return NotFound();
    }

    membership.IsHidden = true;
    await _db.SaveChangesAsync();
    return NoContent();
  }

  [HttpPost("{id}/members")]
  public async Task<IActionResult> AddMember(int id, AddMemberDTO dto)
  {
    var requesterRole = await _db.GroupMembers
        .Where(gm => gm.GroupId == id && gm.UserId == UserId)
        .Select(gm => (GroupMemberRole?)gm.Role)
        .FirstOrDefaultAsync();

    if (requesterRole is null)
    {
      return Forbid();
    }

    if (requesterRole != GroupMemberRole.Admin)
    {
      return Forbid();
    }

    var group = await _db.Groups.FindAsync(id);
    if (group is null)
    {
      return NotFound();
    }

    if (group.IsDirectMessage)
    {
      return BadRequest(new { message = "Cannot add members to a direct message." });
    }

    var targetExists = await _db.Users.AnyAsync(u => u.Id == dto.UserId);
    if (!targetExists)
    {
      return NotFound(new { message = "Target user not found." });
    }

    var alreadyMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == dto.UserId);
    if (alreadyMember)
    {
      return Conflict(new { message = "User is already a member of this group." });
    }

    _db.GroupMembers.Add(new GroupMember
    {
      GroupId = id,
      UserId = dto.UserId,
      Role = GroupMemberRole.Member
    });

    await _db.SaveChangesAsync();

    return Ok(await BuildGroupResponse(id));
  }

  [HttpDelete("{id}/members/{userId}")]
  public async Task<IActionResult> RemoveMember(int id, string userId)
  {
    if (userId != UserId)
    {
      var requesterRole = await _db.GroupMembers
          .Where(gm => gm.GroupId == id && gm.UserId == UserId)
          .Select(gm => (GroupMemberRole?)gm.Role)
          .FirstOrDefaultAsync();

      if (requesterRole != GroupMemberRole.Admin)
      {
        return Forbid();
      }
    }

    var membership = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == userId);
    if (membership is null)
    {
      return NotFound();
    }

    _db.GroupMembers.Remove(membership);
    await _db.SaveChangesAsync();

    return NoContent();
  }

  [HttpGet("{id}/messages")]
  public async Task<IActionResult> GetMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (!isMember)
    {
      return Forbid();
    }

    pageSize = Math.Clamp(pageSize, 1, 100);
    page = Math.Max(page, 1);

    var messages = await _db.Messages
        .Where(m => m.GroupId == id && !m.IsDeleted)
        .OrderByDescending(m => m.SentAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Include(m => m.Sender)
        .Select(m => new MessageResponseDTO
        {
          Id = m.Id,
          GroupId = m.GroupId,
          Content = m.Content,
          SentAt = m.SentAt,
          EditedAt = m.EditedAt,
          IsDeleted = m.IsDeleted,
          SenderId = m.SenderId,
          SenderDisplayName = m.Sender.DisplayName,
          ReadByUserIds = m.ReadReceipts.Select(rr => rr.UserId).ToList(),
          FileUrl = m.FileUrl,
          FileName = m.FileName,
          FileSizeBytes = m.FileSizeBytes,
          FileContentType = m.FileContentType
        })
        .ToListAsync();

    messages.Reverse();

    return Ok(messages);
  }
}