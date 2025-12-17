# Ticketing Backend (ASP.NET Core)

This is a full C# / ASP.NET Core Web API backend for the Next.js ticketing frontend. It uses Entity Framework Core with SQLite, JWT authentication, and seeded demo data.

## Prerequisites
- .NET 8 SDK
- SQLite (bundled with .NET provider)

## Getting Started
1. Install dependencies
   ```bash
   dotnet restore
   ```
2. Apply migrations (optional if using automatic migration on startup)
   ```bash
   dotnet ef database update
   ```
3. Run the API
   ```bash
   dotnet run
   ```

The API listens on `http://localhost:5000` (HTTPS `https://localhost:7000`). CORS is enabled for `http://localhost:3000`.

## Default Users
- Admin: `admin@test.com` / `Admin123!`
- Technician: `tech1@test.com` / `Tech123!`
- Technician: `tech2@test.com` / `Tech123!`
- Client: `client1@test.com` / `Client123!`
- Client: `client2@test.com` / `Client123!`

## Example Requests
- Login
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"Admin123!"}'
  ```
- Create Ticket (as client)
  ```bash
  curl -X POST http://localhost:5000/api/tickets \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"title":"VPN not connecting","description":"Cannot connect to VPN","categoryId":1,"priority":"High"}'
  ```

## Notes
- The database is automatically migrated and seeded on startup.
- Update the `Jwt:Secret` in `appsettings.json` or set `JWT_SECRET` environment variable for production.
