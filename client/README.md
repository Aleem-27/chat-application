# Converseo

A real-time chat application built with ASP.NET Core, SignalR, React, and TypeScript. Supports direct messages, group chats, friend requests, file sharing, typing indicators, read receipts, and live presence — all synced in real time over WebSockets.

## Live Demo

**[https://chat-application.aleemkhan2405.workers.dev](https://chat-application.aleemkhan2405.workers.dev)**

Two demo accounts are available for logging in immediately, no registration required:

| Account | Email | Password |
|---|---|---|
| Demo 1 | `demo@converseo.app` | `Demo#Portfolio2026!` |
| Demo 2 | `demo2@converseo.app` | `Demo2#Portfolio2026!` |

The login page also has one-click buttons for both accounts.

> [!IMPORTANT]
> These are shared public accounts. Their data (messages, friends, groups, avatar) resets to a clean state every time either one logs in, so nothing you add will persist or affect the next visitor.

> [!NOTE]
> This is deployed on free-tier infrastructure. If the app hasn't had traffic in a while, the first request can take 30–60 seconds while the backend wakes up from an idle state. Subsequent requests are fast.

## Screenshots

<!-- Add screenshots here, e.g.: -->
<!-- ![Chat view](docs/screenshots/chat-view.png) -->
<!-- ![Group creation](docs/screenshots/group-modal.png) -->
<!-- ![Dark mode](docs/screenshots/dark-mode.png) -->

## Demo Video

<!-- Add a video link or embed here, e.g.: -->
<!-- [Watch a walkthrough](https://your-video-link) -->

## Features

- Email/password authentication with JWT stored in HttpOnly cookies and refresh token rotation
- Friend system: add by email, accept/decline/cancel requests, remove friends — all live
- Direct messages and multi-member group chats
- Group creation and editing: name, icon, membership, admin transfer, with automatic admin reassignment if the admin leaves
- Real-time messaging over SignalR, including typing indicators and read receipts
- Online presence, visible only between friends
- File, image, and video sharing
- Message editing and soft deletion
- Unread badges with conversation auto-reordering by latest activity
- Notification sounds
- Responsive layout with a collapsible sidebar on small screens
- Light and dark themes

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | ASP.NET Core 10, SignalR, Entity Framework Core, ASP.NET Core Identity, SQL Server |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Zustand, React Router |
| Infrastructure | Cloudflare Pages (frontend), Render (backend), Azure SQL Database (data), Cloudflare R2 (file storage) |

## Local Development Setup

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- SQL Server (local instance, or a free Azure SQL database)

### Backend

```bash
cd server/ChatApp.Api
dotnet restore
```

Create `appsettings.Development.json` (gitignored) with your local configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ChatAppDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "a-long-random-development-secret-at-least-32-characters"
  },
  "Frontend": {
    "Origin": "http://localhost:5173"
  },
  "Storage": {
    "Provider": "Local"
  }
}
```

Apply migrations and run:

```bash
dotnet ef database update
dotnet run
```

The API listens on `https://localhost:<port>` (check `Properties/launchSettings.json` for the exact port) with Swagger available at `/swagger` in development.

> [!TIP]
> To test real-time features properly — presence, typing indicators, live message delivery — register two separate accounts and use two different browser sessions (a normal window and an incognito window works well).

### Frontend

```bash
cd client
npm install
```

Create `.env` (gitignored):
VITE_API_URL=https://localhost:<your-backend-port>


```bash
npm run dev
```

The app runs on `http://localhost:5173`.

> [!WARNING]
> The backend's CORS policy and cookie settings are origin-specific. If the frontend and backend ports don't match what's configured in `Frontend:Origin` on the backend, requests will fail with a CORS error in the browser console rather than a clear authentication error.

## Environment Variables (Production)

| Variable | Purpose |
|---|---|
| `ConnectionStrings__DefaultConnection` | SQL Server / Azure SQL connection string |
| `Jwt__Key` | Signing key for access tokens |
| `Jwt__Issuer` / `Jwt__Audience` | JWT validation parameters |
| `Frontend__Origin` | Allowed CORS origin(s), comma-separated |
| `Storage__Provider` | `Local` or `R2` |
| `R2__AccountId` / `R2__AccessKey` / `R2__SecretKey` / `R2__BucketName` / `R2__PublicBaseUrl` | Cloudflare R2 credentials, required when `Storage__Provider=R2` |
| `ApplyMigrationsOnStartup` | Applies pending EF Core migrations on boot |
| `SeedDemoUser` | Seeds/resets the demo accounts on boot |

> [!CAUTION]
> None of the values above should ever be committed to the repository. In production they're set as environment variables on the hosting platform; locally they belong only in `appsettings.Development.json` and `.env`, both of which are gitignored.

## Architecture Notes

- Authentication uses short-lived JWT access tokens (15 minutes) stored in an HttpOnly cookie, with a longer-lived refresh token (7 days) that rotates on each use.
- SignalR authenticates over the same cookie, since browsers can't attach custom headers to a WebSocket handshake.
- File uploads go through the API rather than directly to storage, so the same validation (size, extension) applies regardless of whether the underlying storage is local disk (development) or Cloudflare R2 (production).
- The frontend caches server state (groups, messages, friends) with TanStack Query and applies live updates from SignalR directly into that cache, rather than triggering full refetches on every event.