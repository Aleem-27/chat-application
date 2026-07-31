namespace ChatApp.Api.DTOs;

public class MessageBlockedDTO
{
  public int GroupId { get; set; }
  public string Reason { get; set; } = string.Empty;
  public string TargetUserId { get; set; } = string.Empty;
  public string TargetDisplayName { get; set; } = string.Empty;
}