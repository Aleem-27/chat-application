using System.IdentityModel.Tokens.Jwt;
using ChatApp.Api.Data;
using ChatApp.Api.DTOs;
using ChatApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/friends")]
[Authorize]
public class FriendsController : ControllerBase
{
  private readonly AppDbContext _db;

  public FriendsController(AppDbContext db)
  {
    _db = db;
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
        _ => Conflict(new { message = "A previous request exists between you and this user." })
      };
    }

    var friendship = new Friendship
    {
      RequesterId = UserId,
      AddresseeId = target.Id
    };

    _db.Friendships.Add(friendship);
    await _db.SaveChangesAsync();

    return Ok(await BuildResponse(friendship));
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

    return Ok(await BuildResponse(friendship));
  }

  [HttpPost("requests/{id}/decline")]
  public async Task<IActionResult> DeclineRequest(int id)
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

    friendship.Status = FriendshipStatus.Declined;
    friendship.RespondedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    return Ok(await BuildResponse(friendship));
  }

  [HttpGet]
  public async Task<IActionResult> GetFriends()
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == UserId || f.AddresseeId == UserId))
        .Include(f => f.Requester)
        .Include(f => f.Addressee)
        .ToListAsync();

    return Ok(friendships.Select(MapToResponse));
  }

  [HttpGet("requests")]
  public async Task<IActionResult> GetPendingRequests()
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Pending && (f.RequesterId == UserId || f.AddresseeId == UserId))
        .Include(f => f.Requester)
        .Include(f => f.Addressee)
        .ToListAsync();

    return Ok(friendships.Select(MapToResponse));
  }

  [HttpDelete("{id}")]
  public async Task<IActionResult> RemoveFriend(int id)
  {
    var friendship = await _db.Friendships.FirstOrDefaultAsync(f => f.Id == id);
    if (friendship is null)
      return NotFound();

    if (friendship.RequesterId != UserId && friendship.AddresseeId != UserId)
      return Forbid();

    _db.Friendships.Remove(friendship);
    await _db.SaveChangesAsync();

    return NoContent();
  }

  private Task<FriendshipResponseDTO> BuildResponse(Friendship friendship)
  {
    return _db.Friendships
        .Include(f => f.Requester)
        .Include(f => f.Addressee)
        .Where(f => f.Id == friendship.Id)
        .Select(f => MapToResponse(f))
        .FirstAsync();
  }

  private FriendshipResponseDTO MapToResponse(Friendship f)
  {
    var isRequester = f.RequesterId == UserId;
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