using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class RegisterDTO
{
  [Required, EmailAddress]
  public string Email { get; set; } = string.Empty;

  [Required, MinLength(8)]
  public string Password { get; set; } = string.Empty;

  [Required, MaxLength(50)]
  public string DisplayName { get; set; } = string.Empty;
}
