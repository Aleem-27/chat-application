using ChatApp.Api.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;

namespace ChatApp.Api.Services;

public class TokenService
{
  private readonly IConfiguration _config;
  public TokenService(IConfiguration config)
  {
    _config = config;
  }

  public string GenerateAccessToken(ApplicationUser user)
  {
    var claims = new List<Claim>
    {
      new(JwtRegisteredClaimNames.Sub, user.Id),
      new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
      new("displayname", user.DisplayName),
      new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
      issuer: _config["Jwt:Issuer"],
      audience: _config["Jwt:Audience"],
      claims: claims,
      expires: DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!)),
      signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
  }

  public RefreshToken GenerateRefreshToken(string userId)
  {
    return new RefreshToken
    {
      Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
      ExpiresAt = DateTime.UtcNow.AddDays(double.Parse(_config["Jwt:RefreshTokenExpiryDays"]!)),
      UserId = userId
    };
  }
}
