namespace ChatApp.Api.Services;

public class UserConnectionTracker : IUserConnectionTracker
{
  private readonly Dictionary<string, HashSet<string>> _userConnections = new();
  private readonly object _lock = new();

  // Returns true if the user is considered online (first connection added)
  public bool AddConnection(string userId, string connectionId)
  {
    lock (_lock)
    {
      var isNewUser = !_userConnections.ContainsKey(userId);
      if (isNewUser)
      {
        _userConnections[userId] = new HashSet<string>();
      }

      _userConnections[userId].Add(connectionId);
      return isNewUser;
    }
  }

  // Returns true if the user has no more connections and is considered offline
  public bool RemoveConnection(string userId, string connectionId)
  {
    lock (_lock)
    {
      if (!_userConnections.TryGetValue(userId, out var connections))
      {
        return false;
      }

      connections.Remove(connectionId);

      if (connections.Count > 0)
      {
        return false;
      }

      _userConnections.Remove(userId);
      return true;
    }
  }

  public IReadOnlyCollection<string> GetOnlineUserIds()
  {
    lock (_lock)
    {
      return _userConnections.Keys.ToList();
    }
  }
}