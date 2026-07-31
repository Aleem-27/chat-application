namespace ChatApp.Api.DTOs;

public class FriendshipEndedDTO
{
  public string ByUserId { get; set; } = string.Empty;
  public string ByDisplayName { get; set; } = string.Empty;
}