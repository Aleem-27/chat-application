using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class UpdateGroupDTO
{
  [MaxLength(100)]
  public string? Name { get; set; }

  public string? IconUrl { get; set; }

  public List<string>? AddMemberUserIds { get; set; }

  public string? AssignAdminUserId { get; set; }
}