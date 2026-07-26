using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Api.Services;

public class JwtUserIdProvider : IUserIdProvider
{
  public string? GetUserId(HubConnectionContext connection)
  {
    return connection.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
  }
}