using Amazon.S3;
using Amazon.S3.Transfer;

namespace ChatApp.Api.Services;

public class R2FileStorageService : IFileStorageService
{
  private readonly IAmazonS3 _s3;
  private readonly IConfiguration _config;

  public R2FileStorageService(IAmazonS3 s3, IConfiguration config)
  {
    _s3 = s3;
    _config = config;
  }

  public async Task<string> UploadAsync(IFormFile file, string storedFileName)
  {
    var bucket = _config["R2:BucketName"]!;
    var transfer = new TransferUtility(_s3);

    await using var stream = file.OpenReadStream();
    await transfer.UploadAsync(stream, bucket, storedFileName);

    var publicBase = _config["R2:PublicBaseUrl"]!.TrimEnd('/');
    return $"{publicBase}/{storedFileName}";
  }
}