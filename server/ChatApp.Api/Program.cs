using System.Text;
using Amazon.S3;
using ChatApp.Api.Data;
using ChatApp.Api.Hubs;
using ChatApp.Api.Models;
using ChatApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Render assigns the port via PORT — bind Kestrel to it
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.WebHost.ConfigureKestrel(options =>
{
  options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // matches the 10MB upload limit
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
  options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
  options.KnownNetworks.Clear(); // Render's proxy isn't in the default trusted list
  options.KnownProxies.Clear();
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
      options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
  options.Password.RequiredLength = 8;
  options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<TokenService>();
builder.Services.AddSingleton<IUserConnectionTracker, UserConnectionTracker>();
builder.Services.AddSingleton<IUserIdProvider, JwtUserIdProvider>();

// Storage: R2 in production, local disk in dev — switched via config, no code branching elsewhere
var storageProvider = builder.Configuration["Storage:Provider"] ?? "Local";
if (storageProvider == "R2")
{
  builder.Services.AddSingleton<IAmazonS3>(sp =>
  {
    var cfg = builder.Configuration;
    var s3Config = new AmazonS3Config
    {
      ServiceURL = $"https://{cfg["R2:AccountId"]}.r2.cloudflarestorage.com",
      ForcePathStyle = true
    };
    return new AmazonS3Client(cfg["R2:AccessKey"], cfg["R2:SecretKey"], s3Config);
  });
  builder.Services.AddScoped<IFileStorageService, R2FileStorageService>();
}
else
{
  builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}

// CORS origin(s) come from config — comma-separated to support multiple (e.g. custom domain + pages.dev)
var allowedOrigins = builder.Configuration["Frontend:Origin"]
    ?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
  options.AddPolicy("ClientApp", policy =>
      policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var jwtKeyBytes = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);

builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
      options.MapInboundClaims = false;
      options.TokenValidationParameters = new TokenValidationParameters
      {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes)
      };
      options.Events = new JwtBearerEvents
      {
        OnMessageReceived = context =>
        {
          if (context.Request.Cookies.TryGetValue("accessToken", out var token))
            context.Token = token;
          return Task.CompletedTask;
        }
      };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Apply pending EF Core migrations on boot — no shell access on Render's free tier to run them manually
if (builder.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
  using var scope = app.Services.CreateScope();
  scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

if (builder.Configuration.GetValue<bool>("SeedDemoUser"))
{
  using var scope = app.Services.CreateScope();
  await DemoSeeder.SeedAsync(scope.ServiceProvider);
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
  app.UseHttpsRedirection(); // skipped in prod — Render's edge already terminates TLS
}

app.UseStaticFiles();
app.UseCors("ClientApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();