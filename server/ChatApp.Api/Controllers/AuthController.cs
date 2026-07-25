using ChatApp.Api.Models;
using ChatApp.Api.Services;
using ChatApp.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ChatApp.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
  private readonly UserManager<ApplicationUser> _userManager;
  private readonly TokenService _tokenService;
  private readonly AppDbContext _db;
  private readonly IConfiguration _config;

  public AuthController(UserManager<ApplicationUser> userManager, TokenService tokenService, AppDbContext db, IConfiguration config)
  {
    _userManager = userManager;
    _tokenService = tokenService;
    _db = db;
    _config = config;
  }

  [HttpPost("register")]
  public async Task<IActionResult> Register(RegisterDTO dto)
  {
    var existingUser = await _userManager.FindByEmailAsync(dto.Email);
    if (existingUser is not null)
    {
      return Conflict(new { message = "Email is already registered" });
    }

    var user = new ApplicationUser
    {
      UserName = dto.Email,
      Email = dto.Email,
      DisplayName = dto.DisplayName
    };

    var result = await _userManager.CreateAsync(user, dto.Password);
    if (!result.Succeeded)
    {
      return BadRequest(result.Errors.Select(e => e.Description));
    }

    await IssueTokensAsync(user);
    return Ok(MapToUserResponse(user));
  }

  [HttpPost("login")]
  public async Task<IActionResult> Login(LoginDTO dto)
  {
    var existingUser = await _userManager.FindByEmailAsync(dto.Email);
    if (existingUser is null)
    {
      return Unauthorized(new { message = "Invalid email or password" });
    }

    var passwordValid = await _userManager.CheckPasswordAsync(existingUser, dto.Password);
    if (!passwordValid)
    {
      return Unauthorized(new { message = "Invalid email or password" });
    }

    await IssueTokensAsync(existingUser);
    return Ok(MapToUserResponse(existingUser));
  }

  [HttpPost("refresh")]
  public async Task<IActionResult> Refresh()
  {
    if (!Request.Cookies.TryGetValue("refreshToken", out var incomingToken))
    {
      return Unauthorized(new { message = "Refresh token is missing" });
    }

    var storedToken = await _db.RefreshTokens.Include(rt => rt.User).FirstOrDefaultAsync(rt => rt.Token == incomingToken);
    if (storedToken is null || !storedToken.IsActive)
    {
      return Unauthorized(new { message = "Invalid or expired refresh token" });
    }

    storedToken.RevokedAt = DateTime.UtcNow;

    var newRefreshToken = _tokenService.GenerateRefreshToken(storedToken.UserId);
    storedToken.ReplacedByToken = newRefreshToken.Token;

    _db.RefreshTokens.Add(newRefreshToken);
    await _db.SaveChangesAsync();

    var newAccessToken = _tokenService.GenerateAccessToken(storedToken.User);
    SetAuthCookies(newAccessToken, newRefreshToken);

    return Ok(MapToUserResponse(storedToken.User));
  }

  [HttpPost("logout")]
  public async Task<IActionResult> Logout()
  {
    if (Request.Cookies.TryGetValue("refreshToken", out var incomingToken))
    {
      var storedToken = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == incomingToken);
      if (storedToken is not null)
      {
        storedToken.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
      }
    }

    Response.Cookies.Delete("accessToken");
    Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "api/auth/refresh" });

    return NoContent();
  }

  [Authorize]
  [HttpGet("me")]
  public async Task<IActionResult> Me()
  {
    var user = await _userManager.GetUserAsync(User);

    if (user is null)
    {
      return NotFound(new { message = "User not found" });
    }

    return Ok(MapToUserResponse(user));
  }

  private async Task IssueTokensAsync(ApplicationUser user)
  {
    var refreshToken = _tokenService.GenerateRefreshToken(user.Id);
    _db.RefreshTokens.Add(refreshToken);
    await _db.SaveChangesAsync();

    var accessToken = _tokenService.GenerateAccessToken(user);
    SetAuthCookies(accessToken, refreshToken);
  }

  private void SetAuthCookies(string accessToken, RefreshToken refreshToken)
  {
    Response.Cookies.Append("accessToken", accessToken, new CookieOptions
    {
      HttpOnly = true,
      Secure = true,
      SameSite = SameSiteMode.Strict,
      Expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!))
    });

    Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
    {
      HttpOnly = true,
      Secure = true,
      SameSite = SameSiteMode.Strict,
      Expires = refreshToken.ExpiresAt,
      Path = "api/auth/refresh"
    });
  }

  private static UserResponseDTO MapToUserResponse(ApplicationUser user)
  {
    return new UserResponseDTO
    {
      Id = user.Id,
      Email = user.Email ?? string.Empty,
      DisplayName = user.DisplayName,
      AvatarUrl = user.AvatarUrl
    };
  }
}