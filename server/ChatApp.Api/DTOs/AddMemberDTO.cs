using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class AddMemberDTO
{
  [Required]
  public string UserId { get; set; } = string.Empty;]
}
