namespace ChatApp.Api.DTOs;

public class FileUploadResponseDTO
{
  public string FileUrl { get; set; } = string.Empty;
  public string FileName { get; set; } = string.Empty;
  public long FileSizeBytes { get; set; }
  public string FileContentType { get; set; } = string.Empty;
}
