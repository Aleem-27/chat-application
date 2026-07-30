using ChatApp.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
  {
  }

  public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
  public DbSet<Group> Groups => Set<Group>();
  public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
  public DbSet<Message> Messages => Set<Message>();
  public DbSet<MessageReadReceipt> MessageReadReceipts => Set<MessageReadReceipt>();
  public DbSet<Friendship> Friendships => Set<Friendship>();

  protected override void OnModelCreating(ModelBuilder builder)
  {
    base.OnModelCreating(builder);

    builder.Entity<RefreshToken>()
      .HasIndex(rt => rt.Token)
      .IsUnique();

    builder.Entity<GroupMember>()
      .HasIndex(gm => new { gm.GroupId, gm.UserId })
      .IsUnique();

    builder.Entity<MessageReadReceipt>()
      .HasIndex(rr => new { rr.MessageId, rr.UserId })
      .IsUnique();

    builder.Entity<Group>()
      .HasOne(g => g.CreatedByUser)
      .WithMany()
      .HasForeignKey(g => g.CreatedByUserId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.Entity<GroupMember>()
      .HasOne(gm => gm.User)
      .WithMany()
      .HasForeignKey(gm => gm.UserId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.Entity<GroupMember>()
      .HasOne(gm => gm.Group)
      .WithMany(g => g.Members)
      .HasForeignKey(gm => gm.GroupId)
      .OnDelete(DeleteBehavior.Cascade);

    builder.Entity<Message>()
      .HasOne(m => m.Sender)
      .WithMany()
      .HasForeignKey(m => m.SenderId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.Entity<Message>()
      .HasOne(m => m.Group)
      .WithMany(g => g.Messages)
      .HasForeignKey(m => m.GroupId)
      .OnDelete(DeleteBehavior.Cascade);

    builder.Entity<MessageReadReceipt>()
      .HasOne(rr => rr.User)
      .WithMany()
      .HasForeignKey(rr => rr.UserId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.Entity<MessageReadReceipt>()
      .HasOne(rr => rr.Message)
      .WithMany(m => m.ReadReceipts)
      .HasForeignKey(rr => rr.MessageId)
      .OnDelete(DeleteBehavior.Cascade);

    builder.Entity<Friendship>()
      .HasOne(f => f.Requester)
      .WithMany()
      .HasForeignKey(f => f.RequesterId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.Entity<Friendship>()
      .HasOne(f => f.Addressee)
      .WithMany()
      .HasForeignKey(f => f.AddresseeId)
      .OnDelete(DeleteBehavior.Restrict);

    builder.Entity<Friendship>()
      .HasIndex(f => new { f.RequesterId, f.AddresseeId })
      .IsUnique();
  }
}