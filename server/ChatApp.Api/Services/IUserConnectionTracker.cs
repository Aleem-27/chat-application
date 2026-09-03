namespace ChatApp.Api.Services;

public interface IUserConnectionTracker
{
  bool AddConnection(string userId, string connectionId);
  bool RemoveConnection(string userId, string connectionId);

  IReadOnlyCollection<string> GetOnlineUserIds();
  IReadOnlyCollection<string> GetConnectionIds(string userId);
}