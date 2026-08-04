namespace ChatApp.Api.DTOs;

public class MessageResponseDTO
{
  public int Id { get; set; }
  public int GroupId { get; set; }
  public string? Content { get; set; }
  public DateTime SentAt { get; set; }
  public DateTime? EditedAt { get; set; }
  public bool IsDeleted { get; set; }
  public string SenderId { get; set; } = string.Empty;
  public string SenderDisplayName { get; set; } = string.Empty;
  public List<string> ReadByUserIds { get; set; } = new();
  public string? FileUrl { get; set; }
  public string? FileName { get; set; }
  public long? FileSizeBytes { get; set; }
  public string? FileContentType { get; set; }
}