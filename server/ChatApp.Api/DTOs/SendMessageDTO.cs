using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class SendMessageDto
{
  public int GroupId { get; set; }

  [MaxLength(4000)]
  public string? Content { get; set; }
}