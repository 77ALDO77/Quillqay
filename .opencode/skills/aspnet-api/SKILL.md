---
name: aspnet-api
description: Develop backend endpoints, database models, and migrations using C# ASP.NET Core + Entity Framework Core + Postgres. Covers project structure, API prefix, EF Core patterns, and WebSocket.
---

## Quick Start

```bash
cd backend && dotnet run                          # Requires DATABASE_URL
cd backend && dotnet build --configuration Release
cd backend && dotnet test
```

## Project Structure

```
backend/
├── Program.cs              # Host builder, service registration, middleware pipeline
├── Controllers/            # API controllers (e.g. PagesController.cs)
├── Models/                 # Entity classes (EF Core models)
├── Data/                   # DbContext, migrations
├── Services/               # Business logic layer
├── Hubs/                   # SignalR hubs (WebSocket)
├── appsettings.json        # Config (connection strings, etc.)
├── appsettings.Development.json
└── .env.example            # Environment variables reference
```

## Architecture

- **ASP.NET Core**: Minimal API or Controller-based API
- **EF Core**: ORM for Postgres with migrations (`dotnet ef migrations add`)
- **DI**: Services registered in `Program.cs` via `builder.Services.Add*()`
- **Middleware**: CORS, authentication, logging in the pipeline

## API Conventions

- **Prefix**: All routes use `/api/v1/` — e.g. `/api/v1/pages`, `/api/v1/pages/{id}`
- **Health check**: `GET /health` (no prefix)
- **WebSocket**: `/ws` endpoint (SignalR or raw WebSocket middleware)
- **CORS**: Permissive for development
- **Logging**: Standard `ILogger<T>` via DI

## Adding a New Endpoint

### Controller-based

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PagesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<Page>>> GetAll()
    {
        return await _db.Pages.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Page>> GetById(Guid id)
    {
        var page = await _db.Pages.FindAsync(id);
        if (page is null) return NotFound();
        return page;
    }

    [HttpPost]
    public async Task<ActionResult<Page>> Create(CreatePageRequest request)
    {
        var page = new Page { Id = Guid.NewGuid(), Title = request.Title };
        _db.Pages.Add(page);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = page.Id }, page);
    }
}
```

### Minimal API (Program.cs)

```csharp
app.MapGet("/api/v1/pages", async (AppDbContext db) =>
    await db.Pages.ToListAsync());

app.MapGet("/api/v1/pages/{id:guid}", async (Guid id, AppDbContext db) =>
    await db.Pages.FindAsync(id) is Page page ? Results.Ok(page) : Results.NotFound());
```

## EF Core Migrations

```bash
cd backend
dotnet ef migrations add MigrationName
dotnet ef database update
```

Migrations are committed to git (`backend/Migrations/`).

## Environment

- **`DATABASE_URL`**: Required env var for PostgreSQL connection
- **`ConnectionStrings__Default`**: Alternative via `appsettings.json`
- **Port**: `0.0.0.0:3000` (configured in `Program.cs` or `launchSettings.json`)

## WebSocket

Use **SignalR** (recommended) or raw WebSocket middleware:

```csharp
// SignalR Hub
public class BroadcastHub : Hub
{
    public async Task SendMessage(string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", message);
    }
}

// Register in Program.cs
builder.Services.AddSignalR();
app.MapHub<BroadcastHub>("/ws");
```

## Dependencies (NuGet)

Key packages: `Microsoft.EntityFrameworkCore`, `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.AspNetCore.SignalR`, `Swashbuckle.AspNetCore` (Swagger).

## Docker

Multi-stage Dockerfile: `mcr.microsoft.com/dotnet/sdk` for build, `mcr.microsoft.com/dotnet/aspnet` for runtime. Expose port 3000.
