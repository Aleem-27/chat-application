namespace ChatApp.Api.Models;

public class Friendship
{
  public int Id { get; set; }
  public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime? RespondedAt { get; set; }

  public string RequesterId { get; set; } = string.Empty;
  public ApplicationUser Requester { get; set; } = null!;

  public string AddresseeId { get; set; } = string.Empty;
  public ApplicationUser Addressee { get; set; } = null!;
}