using Microsoft.AspNetCore.Identity;

namespace ChatApp.Api.Models;

public class ApplicationUser : IdentityUser
{
  public string DisplayName { get; set; } = string.Empty;
  public string? AvatarUrl { get; set; }
  public bool IsOnline { get; set; }
  public DateTime? LastSeenAt { get; set; }
}
