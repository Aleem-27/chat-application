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
[Route("api/friends")]
[Authorize]
public class FriendsController : ControllerBase
{
  private readonly AppDbContext _db;
  private readonly IHubContext<ChatHub> _hub;
  private readonly IUserConnectionTracker _connectionTracker;

  public FriendsController(AppDbContext db, IHubContext<ChatHub> hub, IUserConnectionTracker connectionTracker)
  {
    _db = db;
    _hub = hub;
    _connectionTracker = connectionTracker;
  }

  private string UserId => User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value;

  [HttpPost("requests")]
  public async Task<IActionResult> SendRequest(SendFriendRequestDTO dto)
  {
    var target = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
    if (target is null)
    {
      return NotFound(new { message = "No user found with that email." });
    }

    return await CreateFriendRequestAsync(target);
  }

  [HttpPost("requests/by-user")]
  public async Task<IActionResult> SendRequestByUserId(SendFriendRequestByUserIdDTO dto)
  {
    var target = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.TargetUserId);
    if (target is null)
    {
      return NotFound(new { message = "User not found." });
    }

    return await CreateFriendRequestAsync(target);
  }

  private async Task<IActionResult> CreateFriendRequestAsync(ApplicationUser target)
  {
    if (target.Id == UserId)
    {
      return BadRequest(new { message = "You can't add yourself as a friend." });
    }

    var existing = await _db.Friendships.FirstOrDefaultAsync(f =>
        (f.RequesterId == UserId && f.AddresseeId == target.Id) ||
        (f.RequesterId == target.Id && f.AddresseeId == UserId));

    if (existing is not null)
    {
      return existing.Status switch
      {
        FriendshipStatus.Accepted => Conflict(new { message = "You're already friends." }),
        FriendshipStatus.Pending => Conflict(new { message = "A friend request is already pending." }),
        _ => Conflict(new { message = "A request between you and this user already exists." })
      };
    }

    var friendship = new Friendship { RequesterId = UserId, AddresseeId = target.Id };
    _db.Friendships.Add(friendship);
    await _db.SaveChangesAsync();

    var targetView = await LoadResponse(friendship.Id, target.Id);
    await _hub.Clients.User(target.Id).SendAsync("FriendRequestReceived", targetView);

    return Ok(await LoadResponse(friendship.Id, UserId));
  }

  [HttpPost("requests/{id}/accept")]
  public async Task<IActionResult> AcceptRequest(int id)
  {
    var friendship = await _db.Friendships.FirstOrDefaultAsync(f => f.Id == id);
    if (friendship is null)
    {
      return NotFound();
    }

    if (friendship.AddresseeId != UserId)
    {
      return Forbid();
    }

    if (friendship.Status != FriendshipStatus.Pending)
    {
      return BadRequest(new { message = "This request has already been responded to." });
    }

    friendship.Status = FriendshipStatus.Accepted;
    friendship.RespondedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    var requesterView = await LoadResponse(id, friendship.RequesterId);
    await _hub.Clients.User(friendship.RequesterId).SendAsync("FriendRequestAccepted", requesterView);

    // Reveal presence to both sides immediately, in whichever direction is currently true
    var onlineIds = _connectionTracker.GetOnlineUserIds();
    if (onlineIds.Contains(friendship.RequesterId))
      await _hub.Clients.User(UserId).SendAsync("UserOnline", friendship.RequesterId);
    if (onlineIds.Contains(UserId))
      await _hub.Clients.User(friendship.RequesterId).SendAsync("UserOnline", UserId);

    return Ok(await LoadResponse(id, UserId));
  }

  [HttpPost("requests/{id}/decline")]
  public async Task<IActionResult> DeclineRequest(int id)
  {
    var friendship = await _db.Friendships.Include(f => f.Addressee).FirstOrDefaultAsync(f => f.Id == id);
    if (friendship is null)
    {
      return NotFound();
    }

    if (friendship.AddresseeId != UserId)
    {
      return Forbid();
    }

    if (friendship.Status != FriendshipStatus.Pending)
    {
      return BadRequest(new { message = "This request has already been responded to." });
    }

    var requesterId = friendship.RequesterId;

    // Delete rather than mark Declined — otherwise the pair can never request each other again
    _db.Friendships.Remove(friendship);
    await _db.SaveChangesAsync();

    await _hub.Clients.User(requesterId).SendAsync("FriendRequestDeclined", new FriendshipEndedDTO
    {
      ByUserId = UserId,
      ByDisplayName = friendship.Addressee.DisplayName
    });

    return NoContent();
  }

  [HttpDelete("{id}")]
  public async Task<IActionResult> RemoveFriend(int id)
  {
    var friendship = await _db.Friendships
        .Include(f => f.Requester)
        .Include(f => f.Addressee)
        .FirstOrDefaultAsync(f => f.Id == id);

    if (friendship is null) return NotFound();
    if (friendship.RequesterId != UserId && friendship.AddresseeId != UserId) return Forbid();

    var isRequester = friendship.RequesterId == UserId;
    var otherUserId = isRequester ? friendship.AddresseeId : friendship.RequesterId;
    var selfDisplayName = isRequester ? friendship.Requester.DisplayName : friendship.Addressee.DisplayName;

    _db.Friendships.Remove(friendship);
    await _db.SaveChangesAsync();

    await _hub.Clients.User(otherUserId).SendAsync("FriendRemoved", new FriendshipEndedDTO
    {
      ByUserId = UserId,
      ByDisplayName = selfDisplayName
    });

    // Hide presence from both sides now that they're no longer friends
    await _hub.Clients.User(UserId).SendAsync("UserOffline", otherUserId);
    await _hub.Clients.User(otherUserId).SendAsync("UserOffline", UserId);

    return NoContent();
  }

  [HttpGet]
  public async Task<IActionResult> GetFriends()
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == UserId || f.AddresseeId == UserId))
        .Include(f => f.Requester)
        .Include(f => f.Addressee)
        .ToListAsync();

    return Ok(friendships.Select(f => MapToResponse(f, UserId)));
  }

  [HttpGet("requests")]
  public async Task<IActionResult> GetPendingRequests()
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Pending && (f.RequesterId == UserId || f.AddresseeId == UserId))
        .Include(f => f.Requester)
        .Include(f => f.Addressee)
        .ToListAsync();

    return Ok(friendships.Select(f => MapToResponse(f, UserId)));
  }

  private async Task<FriendshipResponseDTO> LoadResponse(int friendshipId, string perspectiveUserId)
  {
    var f = await _db.Friendships
        .Include(x => x.Requester)
        .Include(x => x.Addressee)
        .FirstAsync(x => x.Id == friendshipId);

    return MapToResponse(f, perspectiveUserId);
  }

  private static FriendshipResponseDTO MapToResponse(Friendship f, string perspectiveUserId)
  {
    var isRequester = f.RequesterId == perspectiveUserId;
    var other = isRequester ? f.Addressee : f.Requester;

    return new FriendshipResponseDTO
    {
      Id = f.Id,
      UserId = other.Id,
      DisplayName = other.DisplayName,
      Email = other.Email ?? string.Empty,
      AvatarUrl = other.AvatarUrl,
      Status = f.Status.ToString(),
      IsIncoming = !isRequester && f.Status == FriendshipStatus.Pending
    };
  }
}