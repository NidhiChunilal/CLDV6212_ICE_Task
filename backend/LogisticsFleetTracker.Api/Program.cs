using LogisticsFleetTracker.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
}

bool usePostgres = false;
if (!string.IsNullOrWhiteSpace(connectionString))
{
    if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var match = System.Text.RegularExpressions.Regex.Match(
                connectionString,
                @"^postgres(?:ql)?:\/\/(?<user>[^:]+):(?<pass>.+?)@(?<host>[^:\/]+)(?::(?<port>\d+))?\/(?<db>[^\?]*).*$");

            if (match.Success)
            {
                var rawPass = match.Groups["pass"].Value;
                // If already percent-encoded, unescape; otherwise use raw
                string parsedPass;
                try { parsedPass = Uri.UnescapeDataString(rawPass); } catch { parsedPass = rawPass; }

                var csb = new Npgsql.NpgsqlConnectionStringBuilder
                {
                    Host = match.Groups["host"].Value,
                    Port = match.Groups["port"].Success ? int.Parse(match.Groups["port"].Value) : 5432,
                    Database = string.IsNullOrWhiteSpace(match.Groups["db"].Value) ? "postgres" : match.Groups["db"].Value,
                    Username = match.Groups["user"].Value,
                    Password = parsedPass,
                    SslMode = Npgsql.SslMode.Require
                };
                connectionString = csb.ConnectionString;
                usePostgres = true;
            }
            else
            {
                usePostgres = true;
            }
        }
        catch
        {
            usePostgres = true;
        }
    }
    else if (connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase) ||
             connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase))
    {
        usePostgres = true;
    }
}

if (usePostgres)
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null);
        }));
}
else
{
    // Local SQLite fallback: zero setup required, persists across restarts
    var dbPath = Path.Combine(AppContext.BaseDirectory, "fleet.db");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite($"Data Source={dbPath}"));
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Logistics Fleet Tracker API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("Frontend");

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        if (db.Database.IsNpgsql())
        {
            logger.LogInformation("Applying PostgreSQL migrations...");
            await db.Database.MigrateAsync();
        }
        else
        {
            logger.LogInformation("Initializing local SQLite schema...");
            await db.Database.EnsureCreatedAsync();
        }

        await DbSeeder.SeedAsync(db);
        logger.LogInformation("Database initialized and seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("Database initialization note: {Message}", ex.Message);
    }
}

app.Run();