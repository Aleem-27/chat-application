namespace ChatApp.Api.Models;

public class GroupMember
{
  public int Id { get; set; }
  public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
  public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
  public bool IsHidden { get; set; }

  public int GroupId { get; set; }
  public Group Group { get; set; } = null!;

  public string UserId { get; set; } = string.Empty;
  public ApplicationUser User { get; set; } = null!;
}