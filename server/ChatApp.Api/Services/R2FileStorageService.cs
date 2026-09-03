using Amazon.S3;
using Amazon.S3.Model;

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

    var request = new PutObjectRequest
    {
      BucketName = bucket,
      Key = storedFileName,
      InputStream = file.OpenReadStream(),
      ContentType = file.ContentType,
      DisablePayloadSigning = true,          // R2 doesn't support AWS's Streaming SigV4
      DisableDefaultChecksumValidation = true // R2 doesn't implement AWS's newer checksum headers
    };

    await _s3.PutObjectAsync(request);

    var publicBase = _config["R2:PublicBaseUrl"]!.TrimEnd('/');
    return $"{publicBase}/{storedFileName}";
  }
}