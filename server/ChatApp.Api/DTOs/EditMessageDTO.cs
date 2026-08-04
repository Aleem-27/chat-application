using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class EditMessageDTO
{
  public int MessageId { get; set; }

  [Required, MaxLength(4000)]
  public string Content { get; set; } = string.Empty;
}