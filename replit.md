# replit.md

## Overview

This is an accessible, screen-reader-first MUD (Multi-User Dungeon) client built as a web application with self-hosting capabilities. The project aims to match Mudlet-like features (profiles, triggers, aliases, scripting, GMCP support) while prioritizing accessibility for VoiceOver/NVDA/Orca users. The architecture follows a web-first approach with a Node.js backend that provides both the web interface and a WebSocket-to-TCP relay for connecting to MUD servers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom cyber/terminal theme (Matrix green, sharp corners)
- **Terminal Rendering**: react-virtuoso for virtualized scrolling of terminal output, anser for ANSI escape code parsing
- **Accessibility**: Native HTML semantics prioritized, aria-live regions for screen readers, Web Speech API for text-to-speech

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with tsx for development
- **API Pattern**: REST endpoints defined in shared/routes.ts with Zod validation
- **WebSocket Relay**: ws library provides WebSocket-to-TCP relay for browser clients to connect to MUD servers
- **Build Process**: Custom build script using esbuild for server bundling and Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: shared/schema.ts defines all tables and types
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Data Model**: Profiles table stores connection info, triggers, aliases, and scripts as JSONB columns

### Shared Code Pattern
- The `shared/` directory contains code used by both client and server
- Schema definitions, API route contracts, and type definitions are shared
- Path aliases: `@shared/*` maps to shared directory, `@/*` maps to client/src

### Scripting Engine
- User-defined triggers and aliases execute JavaScript code
- Scripts run in the browser context (not sandboxed) matching traditional MUD client behavior
- Scripting context provides send(), echo(), setVariable(), and getVariable() functions
- Triggers: Pattern-based automation that runs on incoming MUD lines (supports plain text and regex)
- Aliases: Command macros that expand shortcuts into full commands with optional scripting

### Accessibility Keyboard Shortcuts
- **Ctrl+1 through Ctrl+9**: Read the 1st through 9th most recent line via text-to-speech
- **Ctrl (alone)**: Toggle pause/resume of speech synthesis
- All interactive elements have proper ARIA labels for screen reader compatibility

### Settings Architecture
- **Global Settings**: App-wide defaults stored in global_settings table (single row)
  - Speech: speechEnabled, speechRate, speechVoice
  - Display: fontScale, lineHeight, highContrast, readerMode, showInputEcho
  - Automation: triggersEnabled, aliasesEnabled
  - Connection: autoReconnect, reconnectDelay, keepAlive, keepAliveInterval
- **Profile Settings**: Per-MUD overrides stored in profiles.settings column
  - Null/undefined values inherit from global defaults
  - mergeSettings() function combines global + profile settings
- **Settings UI**: /settings page with Global Defaults and Per-MUD tabs

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database access with drizzle-zod for schema validation
- **connect-pg-simple**: Session storage in PostgreSQL

### MUD Protocol Support
- **WebSocket (ws)**: Server-side WebSocket for relay service
- **net module**: Direct TCP connections from server to MUD servers
- Planned support for TLS, MCCP (compression), and GMCP (structured data)

### UI Framework
- **Radix UI**: Accessible primitives for dialogs, dropdowns, forms, etc.
- **shadcn/ui**: Pre-built component library using Radix + Tailwind
- **Framer Motion**: Animations for UI elements
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Replit plugins**: Development banner, cartographer, and error overlay for Replit environment