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

    var targetExists = await _db.Users.AnyAsync(u => u.Id == dto.TargetUserId);
    if (!targetExists)
    {
      return NotFound(new { message = "Target user not found." });
    }

    var existingGroupId = await FindExistingDirectMessageGroupId(UserId, dto.TargetUserId);
    if (existingGroupId is not null)
    {
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
        .Where(gm => gm.UserId == UserId)
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

  private async Task<GroupResponseDTO> BuildGroupResponse(int groupId)
  {
    var group = await _db.Groups.FirstAsync(g => g.Id == groupId);

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
      member.IsOnline = onlineIds.Contains(member.UserId);
    }

    return new GroupResponseDTO
    {
      Id = group.Id,
      Name = group.Name,
      IsDirectMessage = group.IsDirectMessage,
      CreatedAt = group.CreatedAt,
      Members = members
    };
  }
}