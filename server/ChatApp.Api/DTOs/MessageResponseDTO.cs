namespace ChatApp.Api.DTOs;

public class MessageResponseDto
{
  public int Id { get; set; }
  public int GroupId { get; set; }
  public string? Content { get; set; }
  public DateTime SentAt { get; set; }
  public string SenderId { get; set; } = string.Empty;
  public string SenderDisplayName { get; set; } = string.Empty;
  public string? FileUrl { get; set; }
  public string? FileName { get; set; }
}