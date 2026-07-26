namespace ChatApp.Api.DTOs;

public class ReadReceiptDTO
{
  public int MessageId { get; set; }
  public string UserId { get; set; } = string.Empty;
  public DateTime ReadAt { get; set; }
}
