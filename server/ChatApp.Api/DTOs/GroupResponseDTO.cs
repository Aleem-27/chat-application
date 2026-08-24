namespace ChatApp.Api.DTOs;

public class GroupResponseDTO
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public bool IsDirectMessage { get; set; }
  public string? IconUrl { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime? LastMessageAt { get; set; }
  public LastMessagePreviewDTO? LastMessage { get; set; }
  public List<GroupMemberResponseDTO> Members { get; set; } = new();
}
