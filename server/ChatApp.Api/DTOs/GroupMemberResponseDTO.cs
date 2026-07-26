using ChatApp.Api.Models;

namespace ChatApp.Api.DTOs;

public class GroupMemberResponseDTO
{
  public string UserId { get; set; } = string.Empty;
  public string DisplayName { get; set; } = string.Empty;
  public string? AvatarUrl { get; set; }
  public GroupMemberRole Role { get; set; }
  public bool IsOnline { get; set; }
}
