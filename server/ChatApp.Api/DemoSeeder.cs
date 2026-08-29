using ChatApp.Api.Data;
using ChatApp.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api;

public static class DemoSeeder
{
  private const string Demo1Email = "demo@converseo.app";
  private const string Demo1Password = "DemoPass123!";
  private const string Demo1DisplayName = "Demo Recruiter";

  private const string Demo2Email = "demo2@converseo.app";
  private const string Demo2Password = "DemoPass123!";
  private const string Demo2DisplayName = "Demo Teammate";

  private const string BotEmail = "bot@converseo.app";

  public static async Task SeedAsync(IServiceProvider services)
  {
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var db = services.GetRequiredService<AppDbContext>();

    var demo1 = await EnsureDemoUserAsync(userManager, Demo1Email, Demo1Password, Demo1DisplayName);
    var demo2 = await EnsureDemoUserAsync(userManager, Demo2Email, Demo2Password, Demo2DisplayName);
    var bot = await EnsureBotUserAsync(userManager);

    await EnsureWelcomeDmAsync(db, bot, demo1,
        $"Welcome to Converseo! Try creating a group, sending a file, or adding a friend — add {Demo2Email} to test friend requests and DMs with a second live demo account.");

    await EnsureWelcomeDmAsync(db, bot, demo2,
        $"Welcome to Converseo! This is the second demo account — add {Demo1Email} as a friend to try the full flow from both sides.");
  }

  private static async Task<ApplicationUser> EnsureDemoUserAsync(
      UserManager<ApplicationUser> userManager, string email, string password, string displayName)
  {
    var user = await userManager.FindByEmailAsync(email);
    if (user is null)
    {
      user = new ApplicationUser { UserName = email, Email = email, DisplayName = displayName, EmailConfirmed = true };
      await userManager.CreateAsync(user, password);
    }
    else
    {
      // Reset to a known-good state on every restart — a public shared
      // login can otherwise get its password changed and locked out.
      user.DisplayName = displayName;
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

  private static async Task EnsureWelcomeDmAsync(AppDbContext db, ApplicationUser bot, ApplicationUser demoUser, string message)
  {
    var alreadyFriends = await db.Friendships.AnyAsync(f =>
        (f.RequesterId == demoUser.Id && f.AddresseeId == bot.Id) ||
        (f.RequesterId == bot.Id && f.AddresseeId == demoUser.Id));

    if (alreadyFriends) return;

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