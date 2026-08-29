using ChatApp.Api.DTOs;
using ChatApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
  private static readonly string[] AllowedExtensions =
      { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".zip", ".docx", ".xlsx", ".mp4", ".webm", ".mov" };

  private const long MaxFileSizeBytes = 10 * 1024 * 1024;

  private readonly IFileStorageService _storage;

  public FilesController(IFileStorageService storage) => _storage = storage;

  [HttpPost("upload")]
  [RequestSizeLimit(MaxFileSizeBytes)]
  public async Task<IActionResult> Upload(IFormFile file)
  {
    if (file.Length == 0) return BadRequest(new { message = "No file provided." });
    if (file.Length > MaxFileSizeBytes) return BadRequest(new { message = "File exceeds the 10 MB limit." });

    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!AllowedExtensions.Contains(extension))
      return BadRequest(new { message = $"File type '{extension}' is not allowed." });

    var storedFileName = $"{Guid.NewGuid()}{extension}";
    var fileUrl = await _storage.UploadAsync(file, storedFileName);

    return Ok(new FileUploadResponseDTO
    {
      FileUrl = fileUrl,
      FileName = file.FileName,
      FileSizeBytes = file.Length,
      FileContentType = file.ContentType
    });
  }
}