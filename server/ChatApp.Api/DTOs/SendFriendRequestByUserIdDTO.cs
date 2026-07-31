using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.DTOs;

public class SendFriendRequestByUserIdDTO
{
  [Required]
  public string TargetUserId { get; set; } = string.Empty;
}