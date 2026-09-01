using ChatApp.Api.Data;
using ChatApp.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api;

public static class DemoSeeder
{
  private static readonly (string Email, string Password, string DisplayName)[] DemoAccounts =
  {
    ("demo@converseo.app", "DemoPass123!", "Demo Recruiter"),
    ("demo2@converseo.app", "DemoPass123!", "Demo Teammate"),
  };

  private const string BotEmail = "bot@converseo.app";

  public static bool IsDemoLogin(string email, string password) =>
      DemoAccounts.Any(a =>
          a.Email.Equals(email, StringComparison.OrdinalIgnoreCase) && a.Password == password);

  public static async Task SeedAsync(AppDbContext db, UserManager<ApplicationUser> userManager) =>
      await ResetAndSeedAsync(db, userManager);

  // Wipes every demo account's data and re-seeds a clean welcome state.
  // Called at container startup AND on every successful demo login.
  public static async Task ResetAndSeedAsync(AppDbContext db, UserManager<ApplicationUser> userManager)
  {
    var users = new List<ApplicationUser>();
    foreach (var account in DemoAccounts)
    {
      users.Add(await EnsureDemoUserAsync(userManager, account.Email, account.Password, account.DisplayName));
    }

    var bot = await EnsureBotUserAsync(userManager);
    await WipeDemoDataAsync(db, users.Select(u => u.Id).ToArray());

    for (var i = 0; i < users.Count; i++)
    {
      var otherEmail = DemoAccounts[1 - i].Email;
      await EnsureWelcomeDmAsync(db, bot, users[i],
          $"Welcome to Converseo! Try creating a group, sending a file, or adding a friend — add {otherEmail} to test friend requests and DMs with a second live demo account.");
    }
  }

  private static async Task<ApplicationUser> EnsureDemoUserAsync(
      UserManager<ApplicationUser> userManager, string email, string password, string displayName)
  {
    var user = await userManager.FindByEmailAsync(email);
    if (user is null)
    {
      user = new ApplicationUser
      {
        UserName = email,
        Email = email,
        DisplayName = displayName,
        EmailConfirmed = true,
        IsDemoAccount = true
      };
      await userManager.CreateAsync(user, password);
    }
    else
    {
      user.DisplayName = displayName;
      user.AvatarUrl = null;
      user.IsDemoAccount = true;
      await userManager.UpdateAsync(user);
      var token = await userManager.GeneratePasswordResetTokenAsync(user);
      await userManager.ResetPasswordAsync(user, token, password);
    }
    return user;
  }

  private static async Task<ApplicationUser> EnsureBotUserAsync(UserManager<ApplicationUser> userManager)
  {
    var bot = await userManager.FindByEmailAsync(BotEmail);
    if (bot is null)
    {
      bot = new ApplicationUser { UserName = BotEmail, Email = BotEmail, DisplayName = "Converseo Bot", EmailConfirmed = true };
      await userManager.CreateAsync(bot, Guid.NewGuid() + "Aa1!");
    }
    return bot;
  }

  private static async Task WipeDemoDataAsync(AppDbContext db, string[] demoIds)
  {
    var groupIds = await db.GroupMembers
        .Where(gm => demoIds.Contains(gm.UserId))
        .Select(gm => gm.GroupId)
        .Distinct()
        .ToListAsync();

    if (groupIds.Count > 0)
    {
      var groups = await db.Groups.Where(g => groupIds.Contains(g.Id)).ToListAsync();
      db.Groups.RemoveRange(groups);
    }

    var friendships = await db.Friendships
        .Where(f => demoIds.Contains(f.RequesterId) || demoIds.Contains(f.AddresseeId))
        .ToListAsync();
    db.Friendships.RemoveRange(friendships);

    await db.SaveChangesAsync();
  }

  private static async Task EnsureWelcomeDmAsync(AppDbContext db, ApplicationUser bot, ApplicationUser demoUser, string message)
  {
    db.Friendships.Add(new Friendship
    {
      RequesterId = bot.Id,
      AddresseeId = demoUser.Id,
      Status = FriendshipStatus.Accepted,
      RespondedAt = DateTime.UtcNow
    });

    var dm = new Group { Name = "Direct Message", IsDirectMessage = true, CreatedByUserId = bot.Id };
    dm.Members.Add(new GroupMember { UserId = bot.Id, Role = GroupMemberRole.Member });
    dm.Members.Add(new GroupMember { UserId = demoUser.Id, Role = GroupMemberRole.Member });
    db.Groups.Add(dm);
    await db.SaveChangesAsync();

    db.Messages.Add(new Message { GroupId = dm.Id, SenderId = bot.Id, Content = message });
    await db.SaveChangesAsync();
  }
}