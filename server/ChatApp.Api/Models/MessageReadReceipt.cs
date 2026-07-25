namespace ChatApp.Api.Models;

public class MessageReadReceipt
{
  public int Id { get; set; }
  public DateTime ReadAt { get; set; } = DateTime.UtcNow;

  public int MessageId { get; set; }
  public Message Message { get; set; } = null!;

  public string UserId { get; set; } = string.Empty;
  public ApplicationUser User { get; set; } = null!;
}