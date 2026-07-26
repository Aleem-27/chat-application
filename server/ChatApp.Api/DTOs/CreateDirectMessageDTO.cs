using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class CreateDirectMessageDTO
{
  [Required]
  public string TargetUserId { get; set; } = string.Empty;
}
