using ChatApp.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
  private static readonly string[] AllowedExtensions =
    { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".zip", ".docx", ".xlsx", ".mp4", ".webm", ".mov", ".avi"};

  private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50 MB

  private readonly IWebHostEnvironment _env;

  public FilesController(IWebHostEnvironment env)
  {
    _env = env;
  }

  [HttpPost("upload")]
  [RequestSizeLimit(MaxFileSizeBytes)]
  public async Task<IActionResult> Upload(IFormFile file)
  {
    if (file.Length == 0)
    {
      return BadRequest(new { message = "No file provided." });
    }

    if (file.Length > MaxFileSizeBytes)
    {
      return BadRequest(new { message = "File exceeds the 10 MB limit." });
    }

    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!AllowedExtensions.Contains(extension))
    {
      return BadRequest(new { message = $"File type '{extension}' is not allowed." });
    }

    var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
    Directory.CreateDirectory(uploadsPath);

    var storedFileName = $"{Guid.NewGuid()}{extension}";
    var fullPath = Path.Combine(uploadsPath, storedFileName);

    await using (var stream = new FileStream(fullPath, FileMode.Create))
    {
      await file.CopyToAsync(stream);
    }

    var response = new FileUploadResponseDTO
    {
      FileUrl = $"/uploads/{storedFileName}",
      FileName = file.FileName,
      FileSizeBytes = file.Length,
      FileContentType = file.ContentType
    };

    return Ok(response);
  }
}