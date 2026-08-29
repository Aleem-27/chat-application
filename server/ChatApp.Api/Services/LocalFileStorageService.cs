namespace ChatApp.Api.Services;

public class LocalFileStorageService : IFileStorageService
{
  private readonly IWebHostEnvironment _env;
  public LocalFileStorageService(IWebHostEnvironment env) => _env = env;

  public async Task<string> UploadAsync(IFormFile file, string storedFileName)
  {
    var uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
    Directory.CreateDirectory(uploadsPath);
    var fullPath = Path.Combine(uploadsPath, storedFileName);
    await using var stream = new FileStream(fullPath, FileMode.Create);
    await file.CopyToAsync(stream);
    return $"/uploads/{storedFileName}";
  }
}