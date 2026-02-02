# replit.md

## Overview

Mudscape is an accessible, screen-reader-first MUD (Multi-User Dungeon) client designed as a web application with self-hosting capabilities. It aims to provide Mudlet-like features, including profiles, triggers, aliases, scripting, and GMCP support, with a strong focus on accessibility for screen reader users (VoiceOver/NVDA/Orca). The project utilizes a web-first approach with a Node.js backend serving both the web interface and a WebSocket-to-TCP relay for MUD server connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, Vite
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with a cyber/terminal theme
- **Terminal**: react-virtuoso for virtualized scrolling, anser for ANSI parsing
- **Accessibility**: Native HTML semantics, ARIA live regions, Web Speech API for text-to-speech.
- **Terminal Features**: Multi-MUD support with tabbed interface, real-time connection status, unread counts, and connection management.
- **Organization**: Collapsible class groups, search/filter, bulk actions for automation items.

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with tsx
- **API**: REST endpoints (shared/routes.ts) with Zod validation
- **WebSocket Relay**: `ws` library for WebSocket-to-TCP MUD connections
- **Authentication**: Custom username/password authentication with bcrypt password hashing and PostgreSQL session storage.

### Authentication System
- **Account Modes**: 
  - **Single-user mode**: No login required, all access treated as admin
  - **Multi-user mode**: Username/password authentication with registration
- **Password Security**: bcrypt with 10 salt rounds
- **Session Storage**: PostgreSQL via connect-pg-simple
- **First User**: First account created during setup becomes admin
- **Admin Features**: User management (CRUD), promote/demote admin, toggle registration
- **Installation Wizard**: Initial setup (/setup) allows choosing account mode and creating admin account
- **Routes**:
  - POST /api/auth/login - Login with username/password
  - POST /api/auth/logout - Session invalidation
  - POST /api/auth/register - New user registration (if enabled)
  - GET /api/auth/status - Current auth state and user info
  - POST /api/install/setup - Initial installation
  - GET/POST/PUT/DELETE /api/admin/* - Admin user management

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Defined in shared/schema.ts
- **Migrations**: Drizzle Kit
- **Data Model**: Profiles table stores connection info, triggers, aliases, and scripts as JSONB.

### Scripting Engine
- **Language**: Lua 5.4 (via wasmoon WebAssembly)
- **Features**: User-defined triggers (regex), aliases (macros/scripts), timers (scheduled scripts), keybindings, and on-screen buttons.
- **Context API**: Extensive Lua API for MUD interaction, sound control, text manipulation, dynamic automation, notifications, gauges, cooldowns, movement, logging, and string helpers.
- **Classes**: Organizational groups for automation items.
- **Variables**: Persistent key-value store.

### Package Management
- **Formats**: Supports import/export of custom .mudscape.json packages, and import from Mudlet (.mpackage, .zip, .xml), TinTin++ (.tt, .tin, .txt), and VIPMud (.set, .cfg) formats.
- **Functionality**: Allows bundling, exporting, importing, and installing automation items across profiles.

### Sound System
- **API**: Web Audio API with spatial audio (PannerNode, HRTF)
- **Protocol**: MSP protocol parsing for MUD-triggered sounds.
- **Management**: Soundpacks for organizing and preloading audio files.
- **Lua API**: Functions for playing, stopping, looping, and positioning sounds.

### AI Script Assistant
- **Interface**: Unified chat dialog for generating Lua automation.
- **Features**: Conversational AI generates triggers, aliases, timers, keybindings, or buttons from natural language descriptions. Requires user-provided OpenAI API key (stored locally or encrypted). Provides comprehensive context to the AI (Lua API, sound system).

### Accessibility & Settings
- **Keyboard Shortcuts**: Ctrl+1-9 for reading recent lines, Ctrl+Ctrl for speech toggle, Escape to clear input.
- **Text-to-Speech (TTS)**: Configurable rate, volume, pitch, and voice. Options for speech interruption.
- **Display Settings**: Font scale, line height, high contrast, reader mode, input echo, strip symbols for screen readers.
- **Global & Profile Settings**: App-wide defaults with per-profile overrides and merging logic.
- **In-Game Commands**: `/config` commands for dynamic settings adjustment.

### Help System
- **Quick Help**: In-terminal reference (`/help`).
- **Help Wiki**: Comprehensive documentation (`F1` or `/help page`) covering all features.

### GMCP Support
- **Protocol**: Generic MUD Communication Protocol (Telnet option 201) for structured data.
- **Modules**: Supports Core.Hello, Char.Vitals, Room.Info.

### Self-Hosting
- **Install Wizard**: Interactive `/install` setup for database credentials, ports, and secrets.
- **Deployment**: Generates `docker-compose.yml` (recommended) or `.env` files for Docker/Node.js deployments.

## External Dependencies

### Database
- **PostgreSQL**: Main data store.
- **Drizzle ORM**: Type-safe ORM.
- **connect-pg-simple**: PostgreSQL session storage.

### MUD Protocol
- **ws**: WebSocket server library.
- **net module**: Node.js TCP connections.

### UI Framework
- **Radix UI**: Accessible UI primitives.
- **shadcn/ui**: Component library.
- **Framer Motion**: UI animations.
- **Lucide React**: Icon library.

### Build & Development
- **Vite**: Frontend build tool.
- **esbuild**: Server bundling.