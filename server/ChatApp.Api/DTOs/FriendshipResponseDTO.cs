namespace ChatApp.Api.DTOs;

public class FriendshipResponseDTO
{
  public int Id { get; set; }
  public string UserId { get; set; } = string.Empty;
  public string DisplayName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string? AvatarUrl { get; set; }
  public string Status { get; set; } = string.Empty;
  public bool IsIncoming { get; set; } // true if the current user is the addressee (needs to respond)
}