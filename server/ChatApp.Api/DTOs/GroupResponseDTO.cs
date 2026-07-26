namespace ChatApp.Api.DTOs;

public class GroupResponseDTO
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public bool IsDirectMessage { get; set; }
  public DateTime CreatedAt { get; set; }
  public List<GroupMemberResponseDto> Members { get; set; } = new();
}
