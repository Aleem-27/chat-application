namespace ChatApp.Api.Models;

public class Message
{
  public int Id { get; set; }
  public string? Content { get; set; }
  public DateTime SentAt { get; set; } = DateTime.UtcNow;
  public DateTime? EditedAt { get; set; }
  public bool IsDeleted { get; set; }

  public string? FileUrl { get; set; }
  public string? FileName { get; set; }
  public long? FileSizeBytes { get; set; }
  public string? FileContentType { get; set; }

  public int GroupId { get; set; }
  public Group Group { get; set; } = null!;

  public string SenderId { get; set; } = string.Empty;
  public ApplicationUser Sender { get; set; } = null!;

  public ICollection<MessageReadReceipt> ReadReceipts { get; set; } = new List<MessageReadReceipt>();
}