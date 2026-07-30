using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class SendFriendRequestDTO
{
  [Required, EmailAddress]
  public string Email { get; set; } = string.Empty;
}