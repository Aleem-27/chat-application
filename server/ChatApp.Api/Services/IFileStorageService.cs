namespace ChatApp.Api.Services;

public interface IFileStorageService
{
  Task<string> UploadAsync(IFormFile file, string storedFileName);
}