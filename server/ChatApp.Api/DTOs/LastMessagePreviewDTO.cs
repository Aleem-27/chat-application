namespace ChatApp.Api.DTOs;

public class LastMessagePreviewDTO
{
  public string SenderId { get; set; } = string.Empty;
  public string SenderDisplayName { get; set; } = string.Empty;
  public string? Content { get; set; }
  public bool HasFile { get; set; }
  public string? FileName { get; set; }
  public bool IsDeleted { get; set; }
  public DateTime SentAt { get; set; }
}