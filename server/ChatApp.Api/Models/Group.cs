namespace ChatApp.Api.Models;

public class Group
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public bool IsDirectMessage { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  public string CreatedByUserId { get; set; } = string.Empty;
  public ApplicationUser CreatedByUser { get; set; } = null!;

  public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
  public ICollection<Message> Messages { get; set; } = new List<Message>();
}