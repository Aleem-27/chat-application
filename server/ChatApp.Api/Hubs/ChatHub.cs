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
      foreach (var groupId in groupIds)
      {
        await Clients.Group(GroupName(groupId)).SendAsync("UserOnline", userId);
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
      var groupIds = await _db.GroupMembers
          .Where(gm => gm.UserId == userId)
          .Select(gm => gm.GroupId)
          .ToListAsync();

      foreach (var groupId in groupIds)
      {
        await Clients.Group(GroupName(groupId)).SendAsync("UserOffline", userId);
      }
    }

    await base.OnDisconnectedAsync(exception);
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

  public async Task SendMessage(SendMessageDto dto)
  {
    var isMember = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == dto.GroupId && gm.UserId == UserId);

    if (!isMember)
    {
      throw new HubException("You are not a member of this group.");
    }

    var message = new Message
    {
      GroupId = dto.GroupId,
      SenderId = UserId,
      Content = dto.Content
    };

    _db.Messages.Add(message);
    await _db.SaveChangesAsync();

    var sender = await _db.Users.FindAsync(UserId);

    var response = new MessageResponseDto
    {
      Id = message.Id,
      GroupId = message.GroupId,
      Content = message.Content,
      SentAt = message.SentAt,
      SenderId = UserId,
      SenderDisplayName = sender?.DisplayName ?? string.Empty
    };

    await Clients.Group(GroupName(dto.GroupId)).SendAsync("ReceiveMessage", response);
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