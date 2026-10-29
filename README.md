# BlueLive-Lite — Frontend

BlueLive-Lite is a web control panel for **Ateme playout services**. Administrators use it to register playout servers, manage users and assign services to operators. Operators use it to control live channel graphics (slates, scrolls, logo/bug) and SSAI ad-break signalling (SCTE cue-out / cue-in) from their browser.

This repository contains the React frontend. It talks to the BlueLive-Lite backend API.

---

## Table of Contents

- [Features](#features)
- [User Roles](#user-roles)
- [UI Guide](#ui-guide)
  - [Login](#login)
  - [Navigation Bar](#navigation-bar)
  - [Admin Panel](#admin-panel)
  - [User Lobby](#user-lobby)
  - [Playout Dashboard](#playout-dashboard)
  - [Offline Screen](#offline-screen)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Authentication & Routing](#authentication--routing)
- [API Integration](#api-integration)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

- **Role-based access**: Admin, Tech and Operator users each see their own screens.
- **Server management**: add, edit and delete Ateme servers, with an optional backup server.
- **User management**: create and delete users and assign services to operators.
- **As-run log export**: download playout logs as CSV, filtered by date range and job.
- **Live playout control**: start and stop slates, scrolling tickers and logo/bug graphics.
- **SSAI / SCTE-35 signalling**: manual or automatic cue-out / cue-in with a countdown.
- **Primary / backup awareness**: commands go to the main service and its backup, and live service status is shown.
- **Responsive dark UI**: works on desktop and mobile, with a collapsible menu on small screens.
- **Toast notifications** for every action, plus an offline screen when the connection drops.

---

## User Roles

| Role | Landing page | Access |
|---|---|---|
| **Admin** | `/admin-panel` | Full Admin Panel: servers, users, server details, logs |
| **Tech** | `/admin-panel` | Same as Admin |
| **Operator** | `/lobby` | User Lobby and the Playout Dashboard for the services assigned to them |

After login, users are sent to the page for their role. A user who opens a page their role does not allow is sent back to the login page.

---

## UI Guide

### Login

Route: `/`

- Username and password fields, with a show/hide password toggle.
- The password is encrypted in the browser (RSA-OAEP) before it is sent.
- On success the user is sent to the page for their role. On failure an error toast shows the server's message.

### Navigation Bar

Shown on every page after login.

- **Logo** on the left.
- **Active service name** with *(Primary)* or *(Backup)*, shown on the Playout Dashboard.
- **Username** and a **Logout** button. Logout clears the session and returns to the login page.
- On mobile, these items move into a dropdown menu that also shows the user's role.

### Admin Panel

Route: `/admin-panel` (Admin, Tech)

The panel has four tabs.

#### 1. Servers

- Pick a registered server from the **Server IP** dropdown.
- Switch between the **Primary IP** and **Backup IP** of that server.
- A table lists its services: **Service Name**, **UID** and **Assigned to**.
- **Assign Service** dialog: choose the main service, its backup service and one or more operators.
- Remove an operator from a service (asks for confirmation first).
- The selected server and tab are remembered for the session.

#### 2. Users

- A table of all active users: **Username**, **User Role** and **Instance Assigned**.
- **Create User** dialog: username, role (Operator / Admin / Tech) and password, with form validation.
- Delete a user, or unassign an instance from a user. Both ask for confirmation first.

#### 3. Server Details

- A table of registered servers: **Primary Address**, **Backup Address** and **Actions**.
- **Add Server** dialog: primary server address and credentials. Tick **Add Backup Server** to add backup server details. Addresses can be IPs or DNS names.
- **Edit** a server. The saved password is shown as a placeholder and is kept unless you type a new one.
- **Delete** a server (asks for confirmation first).

#### 4. Logs

- Choose a **Date Range** and a **Job Name** (service).
- **Download** the as-run log as `download_logs.csv`. A notification appears if there is no data for that selection.

### User Lobby

Route: `/lobby` (Operator)

- A table of the services assigned to the logged-in operator: **Name**, **Type** (Primary / Backup) and **Playout**.
- Selecting a service checks its live state first:
  - **Encoding**: the Playout Dashboard opens for that service.
  - **Any other state**: a popup shows the current service state and the dashboard does not open.

### Playout Dashboard

Route: `/dashboard` (Operator)

The control screen for one service and its backup.

| Card | What it does |
|---|---|
| **Timer** | Live clock, and a **Back to Lobby** button |
| **Service** | Main IP and Backup IP, each with a live status. Status is checked every 10 seconds. |
| **Slates** | Choose a slate and **Start** / **Stop** it on air |
| **Scroll** | Create, edit and delete scroll (ticker) texts and start or stop them. Long texts show in full in a tooltip. |
| **Logo / Bug** | Start or stop logo and bug overlays |
| **SSAI** | Send SCTE-35 ad breaks. Details below. |

**SSAI card fields**

- **SSAI Type**: *Splice Signaling* or *Time Signaling*
- **Duration (sec)**: length of the ad break
- **Acquisition ID** / **SSAI ID**, and the **Current ID**, which increases with each break
- **Repeat Interval (sec)** and **Auto SCTE**: send cue-outs again automatically at the set interval
- **Cue Out** starts the break and shows a countdown. **Cue In** ends the break early.
- The current SCTE state is read from the server, so a break that is already running stays visible after a page refresh.

Commands go to the main service and, when one is configured, to the backup service. Buttons are disabled when the service they control is not available. The Ateme access token is refreshed in the background every 15 minutes.

### Offline Screen

If the browser loses its internet connection, the app shows a **No Internet Connection** screen with a **Retry** button. The app comes back on its own when the connection returns.

---

## Tech Stack

| Area | Library |
|---|---|
| Framework | [React 18](https://react.dev/) |
| Build tool | [Vite 6](https://vitejs.dev/) |
| Routing | [React Router 7](https://reactrouter.com/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) + `tailwindcss-animate` |
| UI components | [shadcn/ui](https://ui.shadcn.com/) on top of [Radix UI](https://www.radix-ui.com/) |
| Icons | [lucide-react](https://lucide.dev/) |
| Server state | [TanStack Query 5](https://tanstack.com/query) |
| HTTP client | [Axios](https://axios-http.com/) |
| Forms | [Formik](https://formik.org/) |
| Date picker | `react-datepicker` |
| Encryption | `node-forge` (RSA-OAEP password encryption) |
| CSV / files | `papaparse`, `file-saver` |
| Utilities | `lodash`, `uuid`, `clsx`, `tailwind-merge`, `class-variance-authority` |
| Linting | ESLint 9 (React, Hooks, React Refresh plugins) |

---

## Project Structure

```
.
├── index.html                  # HTML entry point
├── vite.config.js              # Vite config ("@" → ./src alias)
├── tailwind.config.js          # Tailwind theme
├── components.json             # shadcn/ui config
├── .env.example                # Environment variable template
└── src/
    ├── main.jsx                # App bootstrap: QueryClient, Config & Instance providers
    ├── App.jsx                 # Routes, main layout, offline screen
    ├── index.css / App.css     # Global styles
    ├── assets/images/          # Logos and background image
    ├── components/
    │   ├── ui/                 # shadcn/ui components (button, dialog, table, tabs, toast, navbar, ...)
    │   └── custom-components/  # ComboBox, loader, ConfigContext, InstanceContext
    ├── hooks/
    │   └── use-toast.js        # Toast notification hook
    ├── lib/
    │   └── utils.js            # cn() class-name helper
    ├── navigation/
    │   └── protectedRouters.jsx  # Role-based route guard
    ├── screens/
    │   ├── auth/login/         # Login page and login card
    │   ├── admin-panel/        # Servers, Users, Server Details, Logs tabs
    │   │   └── dilog-boxes/    # Add server, create user, assign service, delete confirmation dialogs
    │   └── playout-dashboard/
    │       ├── index.jsx       # User Lobby (route /lobby)
    │       ├── lobbyTable.jsx  # Lobby services table
    │       ├── lobbyDashboard.jsx  # Playout Dashboard (route /dashboard)
    │       └── components/     # Slates, Scroll, Logo/Bug, SSAI, Timer, Create Scroll dialog
    └── utils/helpers/
        ├── api/                # Axios instance, API paths, query/mutation hooks
        ├── auth/               # Session token helpers
        └── regex.jsx           # Validation patterns
```

> **Note:** the file names under `playout-dashboard/` are the opposite of the routes. `index.jsx` renders the User Lobby (`/lobby`) and `lobbyDashboard.jsx` renders the Playout Dashboard (`/dashboard`).

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- A running **BlueLive-Lite backend** you can reach from your machine
- To use the Playout Dashboard, the Ateme servers must also be reachable from your machine (for example over VPN)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
#    then edit .env (see "Environment Variables" below)

# 3. Start the development server
npm run dev
```

The app runs at **http://localhost:5173**.

---

## Environment Variables

The app reads its settings from `.env` files when it is built (Vite `import.meta.env`). Copy `.env.example` to `.env` for local development. Use `.env.production` for production builds.

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_BLULIVE_API_URL` | Yes | Backend base URL (scheme and host) | `http://localhost` |
| `VITE_BLULIVE_API_PORT` | Yes | Backend port | `8000` |
| `VITE_BLULIVE_RSA_PUBLIC_KEY` | Yes | Body of the backend's RSA **public** key on a single line, without the `BEGIN`/`END` lines. Used to encrypt the password at login. | `MIIBIjANBgkq...` |

> Requests go to `${VITE_BLULIVE_API_URL}:${VITE_BLULIVE_API_PORT}`.
> `VITE_BLULIVE_RSA_PUBLIC_KEY` must match the backend's private key, or every login will fail.
> Never commit `.env` files with real values. Only `.env.example` belongs in git.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Build the production version into `dist/` |
| `npm run preview` | Serve the built `dist/` folder locally to check it |
| `npm run lint` | Run ESLint on the project |

---

## Authentication & Routing

1. **Login.** The password is RSA-encrypted and posted to `/api/v1/auth/login`.
2. **Session.** The returned `accessToken`, `userRole` and username are saved in `sessionStorage`, so the session ends when the tab is closed.
3. **Requests.** Axios adds the header `token: Bearer <accessToken>` to every API call.
4. **Route guard.** `ProtectedRoute` checks the token and the role before showing a page. If either is missing or wrong, it redirects to `/`.
5. **Expired session.** Any `401 Unauthorized` response clears the token and returns the user to the login page.
6. **Logout** clears `sessionStorage` and `localStorage`.

The backend also checks the role on every request. The frontend checks only decide which screens to show.

| Route | Page | Roles |
|---|---|---|
| `/` | Login | Everyone |
| `/admin-panel` | Admin Panel | Admin, Tech |
| `/lobby` | User Lobby | Operator |
| `/dashboard` | Playout Dashboard | Operator |
| `*` | Redirects to `/` | — |

---

## API Integration

All API paths are defined in [`src/utils/helpers/api/apiConstant.jsx`](src/utils/helpers/api/apiConstant.jsx). Data is fetched with the `useApiGetQuery` and `useApiMutation` hooks, which wrap TanStack Query and the shared Axios instance (10-second timeout).

| Area | Endpoints |
|---|---|
| Auth | `POST /api/v1/auth/login` |
| Servers | `/api/v1/ateme/addAtemeServer`, `fetchServerList`, `fetchServices`, `fetchAtemeServerDetails`, `editAtemeServer`, `deleteServer`, `getServiceStatus` |
| Users | `/api/v1/user/register`, `fetchUsers`, `deleteUser`, `assignService`, `unassignService`, `fetchUserServices` |
| Logs | `/api/v1/logs/getServices`, `downloadAsrun` |
| Playout | `/api/v1/ateme/fetchServiceConfig`, `fetchAtemeToken`, `fetchGraphics` |
| Graphics | `/api/v1/graphics/startStopGraphics`, `stopSlate`, `fetchScrolls`, `addScrolls` |
| SSAI / SCTE | `/api/v1/graphics/cueOut`, `cueIn`, `fetchCurrentSCTE` |

**Polling intervals**

| Data | Interval |
|---|---|
| Service status | every 10 seconds |
| Ateme access token | every 15 minutes, also when the tab is in the background |

---

## Building for Production

```bash
# 1. Put the production values in .env.production
# 2. Build
npm run build
# 3. (Optional) Check the build locally
npm run preview
```

The output in `dist/` is a static single-page app and can be served by any web server. The server must send `index.html` for unknown paths (SPA fallback), so that refreshing `/admin-panel`, `/lobby` or `/dashboard` works.

Environment variables are included in the bundle at build time. If they change, run the build again.

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Every login fails | `VITE_BLULIVE_RSA_PUBLIC_KEY` does not match the backend's key pair. Paste the backend's current public key body. |
| Network or timeout errors | Check `VITE_BLULIVE_API_URL` and `VITE_BLULIVE_API_PORT` and that the backend is running. Restart `npm run dev` after editing `.env`. |
| Sent back to login right away | The token expired (401) or your role cannot open that page. Log in again with the right user. |
| "Service is ... " popup in the lobby | The service is not in the *Encoding* state. Start it on the Ateme server first. |
| Dashboard buttons are disabled | The main or backup service is unreachable. Check the network or VPN connection to the Ateme servers. |
| 404 after refreshing a page in production | The web server has no SPA fallback to `index.html`. |
| Log download says "No Data" | No as-run entries exist for that date range and job. |

---

## Contributing

Every branch, commit and pull request is tied to a Jira ticket (project key `VCODE`).

- [docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md): the day-to-day steps (branch, commit, PR, release)
- [docs/BRANCHING.md](docs/BRANCHING.md): the branch model, releases and branch protection
- [CHANGELOG.md](CHANGELOG.md): what changed in each release

One-time setup per clone:

```bash
git config core.hooksPath .githooks
git config commit.template .gitmessage.txt
```

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `stage` | Pre-production testing (QA / UAT) |
| `develop` | Active development; all work is merged here first |

Commit message format: `VCODE-<n>: <imperative summary>`, for example `VCODE-12: add reorder option to scroll texts`.

---

## License

Private — © Skandha MS. All rights reserved.
