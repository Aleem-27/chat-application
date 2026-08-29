using ChatApp.Api.Data;
using ChatApp.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Api;

public static class DemoSeeder
{
  private const string DemoEmail = "demo@converseo.app";
  private const string DemoPassword = "Demopass123!";
  private const string BotEmail = "bot@converseo.app";

  public static async Task SeedAsync(IServiceProvider services)
  {
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var db = services.GetRequiredService<AppDbContext>();

    var demoUser = await userManager.FindByEmailAsync(DemoEmail);
    if (demoUser is null)
    {
      demoUser = new ApplicationUser
      {
        UserName = DemoEmail,
        Email = DemoEmail,
        DisplayName = "Demo Recruiter",
        EmailConfirmed = true
      };
      await userManager.CreateAsync(demoUser, DemoPassword);
    }
    else
    {
      // Reset to a known-good state on every restart — a public shared
      // login can otherwise get its password changed and locked out.
      demoUser.DisplayName = "Demo Recruiter";
      await userManager.UpdateAsync(demoUser);
      var token = await userManager.GeneratePasswordResetTokenAsync(demoUser);
      await userManager.ResetPasswordAsync(demoUser, token, DemoPassword);
    }

    var botUser = await userManager.FindByEmailAsync(BotEmail);
    if (botUser is null)
    {
      botUser = new ApplicationUser
      {
        UserName = BotEmail,
        Email = BotEmail,
        DisplayName = "Converseo Bot",
        EmailConfirmed = true
      };
      await userManager.CreateAsync(botUser, Guid.NewGuid() + "Aa1!");
    }

    var alreadyFriends = await db.Friendships.AnyAsync(f =>
        (f.RequesterId == demoUser.Id && f.AddresseeId == botUser.Id) ||
        (f.RequesterId == botUser.Id && f.AddresseeId == demoUser.Id));

    if (!alreadyFriends)
    {
      db.Friendships.Add(new Friendship
      {
        RequesterId = botUser.Id,
        AddresseeId = demoUser.Id,
        Status = FriendshipStatus.Accepted,
        RespondedAt = DateTime.UtcNow
      });

      var dm = new Group { Name = "Direct Message", IsDirectMessage = true, CreatedByUserId = botUser.Id };
      dm.Members.Add(new GroupMember { UserId = botUser.Id, Role = GroupMemberRole.Member });
      dm.Members.Add(new GroupMember { UserId = demoUser.Id, Role = GroupMemberRole.Member });
      db.Groups.Add(dm);
      await db.SaveChangesAsync();

      db.Messages.Add(new Message
      {
        GroupId = dm.Id,
        SenderId = botUser.Id,
        Content = "Welcome to Converseo! Try creating a group, sending a file, or adding a friend."
      });
      await db.SaveChangesAsync();
    }
  }
}