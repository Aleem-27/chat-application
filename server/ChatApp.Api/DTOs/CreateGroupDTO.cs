using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class CreateGroupDTO
{
  [Required, MaxLength(100)]
  public string Name { get; set; } = string.Empty;

  public string? IconUrl { get; set; }

  public List<string> MemberUserIds { get; set; } = new();
}