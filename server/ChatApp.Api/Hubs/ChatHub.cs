using System.IdentityModel.Tokens.Jwt;
using ChatApp.Api.Data;
using ChatApp.Api.DTOs;
using ChatApp.Api.Models;
using ChatApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
  private readonly AppDbContext _db;
  private readonly IUserConnectionTracker _connectionTracker;

  public ChatHub(AppDbContext db, IUserConnectionTracker connectionTracker)
  {
    _db = db;
    _connectionTracker = connectionTracker;
  }

  private string UserId => Context.User!.FindFirst(JwtRegisteredClaimNames.Sub)!.Value;

  public override async Task OnConnectedAsync()
  {
    var userId = UserId;
    var justCameOnline = _connectionTracker.AddConnection(userId, Context.ConnectionId);

    var groupIds = await _db.GroupMembers
        .Where(gm => gm.UserId == userId)
        .Select(gm => gm.GroupId)
        .ToListAsync();

    foreach (var groupId in groupIds)
    {
      await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(groupId));
    }

    if (justCameOnline)
    {
      var friendIds = await GetFriendUserIdsAsync(userId);
      if (friendIds.Count > 0)
      {
        await Clients.Users(friendIds).SendAsync("UserOnline", userId);
      }
    }

    await base.OnConnectedAsync();
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    var userId = UserId;
    var wentOffline = _connectionTracker.RemoveConnection(userId, Context.ConnectionId);

    if (wentOffline)
    {
      var friendIds = await GetFriendUserIdsAsync(userId);
      if (friendIds.Count > 0)
      {
        await Clients.Users(friendIds).SendAsync("UserOffline", userId);
      }
    }

    await base.OnDisconnectedAsync(exception);
  }

  private async Task<List<string>> GetFriendUserIdsAsync(string userId)
  {
    var friendships = await _db.Friendships
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
        .ToListAsync();

    return friendships.Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId).ToList();
  }

  public async Task JoinGroup(int groupId)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == UserId);

    if (!isMember)
    {
      throw new HubException("You are not a member of this group.");
    }

    await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(groupId));
  }

  public async Task LeaveGroup(int groupId)
  {
    await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(groupId));
  }

  public async Task SendMessage(SendMessageDTO dto)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == dto.GroupId && gm.UserId == UserId);
    if (!isMember)
    {
      throw new HubException("You are not a member of this group.");
    }

    var group = await _db.Groups.FirstAsync(g => g.Id == dto.GroupId);
    if (group.IsDirectMessage)
    {
      var otherMember = await _db.GroupMembers
          .Include(gm => gm.User)
          .FirstOrDefaultAsync(gm => gm.GroupId == dto.GroupId && gm.UserId != UserId);

      if (otherMember is not null)
      {
        var isFriend = await _db.Friendships.AnyAsync(f =>
            f.Status == FriendshipStatus.Accepted &&
            ((f.RequesterId == UserId && f.AddresseeId == otherMember.UserId) ||
             (f.RequesterId == otherMember.UserId && f.AddresseeId == UserId)));

        if (!isFriend)
        {
          await Clients.Caller.SendAsync("MessageBlocked", new MessageBlockedDTO
          {
            GroupId = dto.GroupId,
            Reason = "NotFriends",
            TargetUserId = otherMember.UserId,
            TargetDisplayName = otherMember.User.DisplayName
          });
          return;
        }
      }
    }


    if (string.IsNullOrWhiteSpace(dto.Content) && string.IsNullOrWhiteSpace(dto.FileUrl))
    {
      throw new HubException("A message needs either content or a file.");
    }

    var message = new Message
    {
      GroupId = dto.GroupId,
      SenderId = UserId,
      Content = dto.Content,
      FileUrl = dto.FileUrl,
      FileName = dto.FileName,
      FileSizeBytes = dto.FileSizeBytes,
      FileContentType = dto.FileContentType
    };

    _db.Messages.Add(message);
    await _db.SaveChangesAsync();

    var sender = await _db.Users.FindAsync(UserId);

    var response = MapToResponse(message);

    await Clients.Group(GroupName(dto.GroupId)).SendAsync("ReceiveMessage", response);
  }

  public async Task EditMessage(EditMessageDTO dto)
  {
    var message = await _db.Messages.Include(m => m.Sender).FirstOrDefaultAsync(m => m.Id == dto.MessageId);
    if (message is null)
      throw new HubException("Message not found.");

    if (message.SenderId != UserId)
      throw new HubException("You can only edit your own messages.");

    if (message.IsDeleted)
      throw new HubException("Cannot edit a deleted message.");

    message.Content = dto.Content;
    message.EditedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    await Clients.Group(GroupName(message.GroupId)).SendAsync("MessageEdited", MapToResponse(message));
  }

  public async Task DeleteMessage(int messageId)
  {
    var message = await _db.Messages.Include(m => m.Sender).FirstOrDefaultAsync(m => m.Id == messageId);
    if (message is null)
      throw new HubException("Message not found.");

    if (message.SenderId != UserId)
      throw new HubException("You can only delete your own messages.");

    message.IsDeleted = true;
    message.Content = null;
    message.FileUrl = null;
    message.FileName = null;
    message.FileSizeBytes = null;
    message.FileContentType = null;
    await _db.SaveChangesAsync();

    await Clients.Group(GroupName(message.GroupId)).SendAsync("MessageDeleted", MapToResponse(message));
  }

  private static MessageResponseDTO MapToResponse(Message message) => new()
  {
    Id = message.Id,
    GroupId = message.GroupId,
    Content = message.Content,
    SentAt = message.SentAt,
    EditedAt = message.EditedAt,
    IsDeleted = message.IsDeleted,
    SenderId = message.SenderId,
    SenderDisplayName = message.Sender.DisplayName,
    FileUrl = message.FileUrl,
    FileName = message.FileName,
    FileSizeBytes = message.FileSizeBytes,
    FileContentType = message.FileContentType
  };

  public async Task MarkAsRead(int messageId)
  {
    var message = await _db.Messages.FindAsync(messageId);
    if (message is null)
    {
      throw new HubException("Message not found.");
    }

    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == message.GroupId && gm.UserId == UserId);
    if (!isMember)
    {
      throw new HubException("You are not a member of this group.");
    }

    var alreadyRead = await _db.MessageReadReceipts.AnyAsync(rr => rr.MessageId == messageId && rr.UserId == UserId);

    if (alreadyRead)
    {
      return;
    }

    var receipt = new MessageReadReceipt
    {
      MessageId = messageId,
      UserId = UserId
    };

    _db.MessageReadReceipts.Add(receipt);
    await _db.SaveChangesAsync();

    var dto = new ReadReceiptDTO
    {
      MessageId = messageId,
      UserId = UserId,
      ReadAt = receipt.ReadAt
    };

    await Clients.Group(GroupName(message.GroupId)).SendAsync("MessageRead", dto);
  }

  public async Task Typing(int groupId)
  {
    await Clients.OthersInGroup(GroupName(groupId)).SendAsync("UserTyping", groupId, UserId);
  }

  public async Task StopTyping(int groupId)
  {
    await Clients.OthersInGroup(GroupName(groupId)).SendAsync("UserStoppedTyping", groupId, UserId);
  }

  private static string GroupName(int groupId) => $"group-{groupId}";
}