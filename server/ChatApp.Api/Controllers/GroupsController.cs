using ChatApp.Api.Data;
using ChatApp.Api.DTOs;
using ChatApp.Api.Hubs;
using ChatApp.Api.Models;
using ChatApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
  private readonly AppDbContext _db;
  private readonly IUserConnectionTracker _connectionTracker;
  private readonly IHubContext<ChatHub> _hub;

  public GroupsController(AppDbContext db, IUserConnectionTracker connectionTracker, IHubContext<ChatHub> hub)
  {
    _db = db;
    _connectionTracker = connectionTracker;
    _hub = hub;
  }

  private string UserId => User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value;

  [HttpPost]
  public async Task<IActionResult> CreateGroup(CreateGroupDTO dto)
  {
    var friendIds = await GetFriendUserIdsAsync(UserId);
    var invalidMembers = dto.MemberUserIds.Where(id => id != UserId && !friendIds.Contains(id)).ToList();
    if (invalidMembers.Count > 0)
      return BadRequest(new { message = "You can only add friends to a group." });

    var group = new Group
    {
      Name = dto.Name,
      IconUrl = dto.IconUrl,
      IsDirectMessage = false,
      CreatedByUserId = UserId
    };

    group.Members.Add(new GroupMember { UserId = UserId, Role = GroupMemberRole.Admin });

    foreach (var memberId in dto.MemberUserIds.Distinct().Where(id => id != UserId))
    {
      group.Members.Add(new GroupMember { UserId = memberId, Role = GroupMemberRole.Member });
    }

    _db.Groups.Add(group);
    await _db.SaveChangesAsync();

    foreach (var member in group.Members.Where(m => m.UserId != UserId))
    {
      var view = await BuildGroupResponse(group.Id, member.UserId);
      await _hub.Clients.User(member.UserId).SendAsync("GroupCreated", view);
    }

    return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, await BuildGroupResponse(group.Id, UserId));
  }

  [HttpPatch("{id}")]
  public async Task<IActionResult> UpdateGroup(int id, UpdateGroupDTO dto)
  {
    var group = await _db.Groups.FirstOrDefaultAsync(g => g.Id == id);
    if (group is null) return NotFound();
    if (group.IsDirectMessage) return BadRequest(new { message = "Direct messages can't be edited." });

    var myMembership = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (myMembership is null) return Forbid();
    if (myMembership.Role != GroupMemberRole.Admin) return Forbid();

    if (!string.IsNullOrWhiteSpace(dto.Name))
      group.Name = dto.Name;

    if (dto.IconUrl is not null)
      group.IconUrl = dto.IconUrl;

    var newlyAddedUserIds = new List<string>();

    if (dto.AddMemberUserIds is { Count: > 0 })
    {
      var friendIds = await GetFriendUserIdsAsync(UserId);
      var existingMemberIds = await _db.GroupMembers.Where(gm => gm.GroupId == id).Select(gm => gm.UserId).ToListAsync();

      foreach (var candidateId in dto.AddMemberUserIds.Distinct())
      {
        if (existingMemberIds.Contains(candidateId)) continue;
        if (!friendIds.Contains(candidateId)) continue; // skip non-friends rather than failing the whole edit

        _db.GroupMembers.Add(new GroupMember { GroupId = id, UserId = candidateId, Role = GroupMemberRole.Member });
        newlyAddedUserIds.Add(candidateId);
      }
    }

    var adminChanged = false;

    if (!string.IsNullOrWhiteSpace(dto.AssignAdminUserId) && dto.AssignAdminUserId != UserId)
    {
      var targetMembership = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == dto.AssignAdminUserId);
      if (targetMembership is null)
        return BadRequest(new { message = "That user isn't a member of this group." });

      targetMembership.Role = GroupMemberRole.Admin;
      myMembership.Role = GroupMemberRole.Member;
      adminChanged = true;
    }

    await _db.SaveChangesAsync();

    var allMemberIds = await _db.GroupMembers.Where(gm => gm.GroupId == id).Select(gm => gm.UserId).ToListAsync();

    foreach (var memberId in allMemberIds)
    {
      var view = await BuildGroupResponse(id, memberId);
      var eventName = newlyAddedUserIds.Contains(memberId) ? "GroupCreated" : "GroupUpdated";
      await _hub.Clients.User(memberId).SendAsync(eventName, view);

      if (adminChanged)
      {
        await _hub.Clients.User(memberId).SendAsync("GroupAdminChanged", view);
      }
    }

    return Ok(await BuildGroupResponse(id, UserId));
  }

  [HttpPost("{id}/leave")]
  public async Task<IActionResult> LeaveGroup(int id)
  {
    var group = await _db.Groups.FirstOrDefaultAsync(g => g.Id == id);
    if (group is null) return NotFound();
    if (group.IsDirectMessage) return BadRequest(new { message = "Can't leave a direct message." });

    var membership = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (membership is null) return NotFound();

    var wasAdmin = membership.Role == GroupMemberRole.Admin;
    _db.GroupMembers.Remove(membership);
    await _db.SaveChangesAsync();

    var remainingMembers = await _db.GroupMembers
        .Where(gm => gm.GroupId == id)
        .OrderBy(gm => gm.JoinedAt)
        .ToListAsync();

    if (wasAdmin && remainingMembers.Count > 0 && !remainingMembers.Any(m => m.Role == GroupMemberRole.Admin))
    {
      remainingMembers[0].Role = GroupMemberRole.Admin;
      await _db.SaveChangesAsync();
    }

    foreach (var member in remainingMembers)
    {
      var view = await BuildGroupResponse(id, member.UserId);
      await _hub.Clients.User(member.UserId).SendAsync("GroupUpdated", view);
    }

    return NoContent();
  }

  [HttpPost("direct")]
  public async Task<IActionResult> GetOrCreateDirectMessage(CreateDirectMessageDTO dto)
  {
    if (dto.TargetUserId == UserId)
      return BadRequest(new { message = "Cannot start a direct message with yourself." });

    var targetExists = await _db.Users.AnyAsync(u => u.Id == dto.TargetUserId);
    if (!targetExists)
      return NotFound(new { message = "Target user not found." });

    var isFriend = await _db.Friendships.AnyAsync(f =>
        f.Status == FriendshipStatus.Accepted &&
        ((f.RequesterId == UserId && f.AddresseeId == dto.TargetUserId) ||
         (f.RequesterId == dto.TargetUserId && f.AddresseeId == UserId)));

    if (!isFriend)
      return Forbid();

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

      return Ok(await BuildGroupResponse(existingGroupId.Value, UserId));
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

    return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, await BuildGroupResponse(group.Id, UserId));
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
      groups.Add(await BuildGroupResponse(groupId, UserId));
    }

    return Ok(groups);
  }

  [HttpGet("{id}")]
  public async Task<IActionResult> GetGroup(int id)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (!isMember)
      return Forbid();

    return Ok(await BuildGroupResponse(id, UserId));
  }

  [HttpPost("{id}/hide")]
  public async Task<IActionResult> HideGroup(int id)
  {
    var membership = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (membership is null) return NotFound();

    membership.IsHidden = true;
    await _db.SaveChangesAsync();
    return NoContent();
  }

  [HttpGet("{id}/messages")]
  public async Task<IActionResult> GetMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == UserId);
    if (!isMember)
      return Forbid();

    pageSize = Math.Clamp(pageSize, 1, 100);
    page = Math.Max(page, 1);

    var messages = await _db.Messages
        .Where(m => m.GroupId == id && !m.IsDeleted || m.GroupId == id && m.IsDeleted)
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
          FileUrl = m.FileUrl,
          FileName = m.FileName,
          FileSizeBytes = m.FileSizeBytes,
          FileContentType = m.FileContentType,
          ReadByUserIds = m.ReadReceipts.Select(rr => rr.UserId).ToList()
        })
        .ToListAsync();

    messages.Reverse();
    return Ok(messages);
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
        return groupId;
    }

    return null;
  }

  private async Task<HashSet<string>> GetFriendUserIdsAsync(string userId)
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
        .ToListAsync();

    return friendships.Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId).ToHashSet();
  }

  private async Task<GroupResponseDTO> BuildGroupResponse(int groupId, string perspectiveUserId)
  {
    var group = await _db.Groups.FirstAsync(g => g.Id == groupId);
    var friendIds = await GetFriendUserIdsAsync(perspectiveUserId);

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
      IconUrl = group.IconUrl,
      IsDirectMessage = group.IsDirectMessage,
      CreatedAt = group.CreatedAt,
      Members = members,
      LastMessageAt = lastMessage?.SentAt,
      LastMessage = lastMessage
    };
  }
}