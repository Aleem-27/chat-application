using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class UpdateProfileDTO
{
  [MaxLength(50)]
  public string? DisplayName { get; set; }

  [EmailAddress]
  public string? Email { get; set; }

  public string? AvatarUrl { get; set; }
}