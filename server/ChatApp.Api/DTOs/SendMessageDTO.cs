using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class SendMessageDTO
{
  public int GroupId { get; set; }

  [MaxLength(4000)]
  public string? Content { get; set; }

  public string? FileUrl { get; set; }
  public string? FileName { get; set; }
  public long? FileSizeBytes { get; set; }
  public string? FileContentType { get; set; }
}