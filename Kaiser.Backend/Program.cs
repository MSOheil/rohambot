using Microsoft.EntityFrameworkCore;
using Kaiser.Backend.Data;
using Kaiser.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database connection configuration (PostgreSQL with SQLite fallback)
var pgConnectionString = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION") 
                         ?? builder.Configuration.GetConnectionString("PostgresConnection");
var defaultConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                              ?? "Data Source=db/ARSSub.db";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Try PostgreSQL if available, otherwise SQLite
    var usePostgres = Environment.GetEnvironmentVariable("USE_POSTGRES") == "true";
    if (usePostgres && !string.IsNullOrEmpty(pgConnectionString))
    {
        options.UseNpgsql(pgConnectionString);
    }
    else
    {
        options.UseSqlite(defaultConnectionString);
    }
});

// HttpClient
builder.Services.AddHttpClient();

// Business services
builder.Services.AddScoped<IXuiService, XuiService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

// Background Hosted Service
builder.Services.AddHostedService<BackgroundWorkerService>();

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure DB directory and initialization
var dbDir = Path.Combine(app.Environment.ContentRootPath, "db");
if (!Directory.Exists(dbDir))
{
    Directory.CreateDirectory(dbDir);
}

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        DbInitializer.Initialize(db);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error during Database Initialization");
    }
}

// Swagger API Documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kaiser API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

// Fallback to index.html for frontend routing
app.MapFallbackToFile("index.html");

app.Run();
