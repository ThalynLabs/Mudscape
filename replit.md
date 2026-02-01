# replit.md

## Overview

**Mudscape** is an accessible, screen-reader-first MUD (Multi-User Dungeon) client built as a web application with self-hosting capabilities. The project aims to match Mudlet-like features (profiles, triggers, aliases, scripting, GMCP support) while prioritizing accessibility for VoiceOver/NVDA/Orca users. The architecture follows a web-first approach with a Node.js backend that provides both the web interface and a WebSocket-to-TCP relay for connecting to MUD servers.

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

### Profile Features
- **Auto Connect**: Profiles can be configured to automatically connect when the app starts
- **Character Settings**: Store character name and password for automatic login
- **Login Commands**: Configure commands to send after connecting (e.g., "connect {name} {password}")
- **Placeholder Support**: {name} and {password} placeholders in login commands are replaced with stored credentials

### Shared Code Pattern
- The `shared/` directory contains code used by both client and server
- Schema definitions, API route contracts, and type definitions are shared
- Path aliases: `@shared/*` maps to shared directory, `@/*` maps to client/src

### Scripting Engine
- **Lua Engine**: User-defined triggers, aliases, timers, and keybindings execute Lua code via wasmoon (Lua 5.4 WebAssembly)
- Scripts run in the browser context matching traditional MUD client behavior (like Mudlet)
- Scripting context provides: send(), echo(), setVariable(), getVariable(), playSound(), stopSound(), loopSound(), setSoundPosition()
- Triggers: Pattern-based automation that runs on incoming MUD lines (regex patterns)
- Aliases: Command macros that expand shortcuts with $1/$2 substitution or execute Lua scripts (isScript=true)
- Timers: Scheduled Lua script execution (one-shot or repeating intervals), managed via TimersPanel
- Keybindings: Custom keyboard shortcuts mapped to commands or Lua scripts, recorded via KeybindingsPanel
- Buttons: On-screen clickable buttons for quick commands or Lua scripts, managed via ButtonsPanel
- Classes: Organizational groups for automation items; toggling a class enables/disables all contained triggers/aliases/timers/keybindings/buttons
- Variables: Persistent key-value store accessible via Lua; debounced (1 second) persistence to profile

### Package Manager
- **Package System**: Bundle automation items (triggers, aliases, timers, keybindings, buttons, classes) into shareable packages
- **Export**: Create packages from current profile's automation items, download as .mudpack.json files
- **Import Mudscape**: Upload .mudpack.json files to add packages to library
- **Import Mudlet**: Import .mpackage, .zip, or .xml files from Mudlet
  - Parses Mudlet's XML format (TriggerPackage, AliasPackage, TimerPackage, KeyPackage, ActionPackage, ScriptPackage)
  - Converts triggers, aliases, timers, keybindings, buttons to Mudscape's native format
  - Preserves Lua scripts (both clients use Lua)
  - ZIP extraction for .mpackage files via JSZip
- **Install**: Apply package contents to current profile
- **Library**: Store packages in database for reuse across profiles

### Sound System
- **Web Audio API**: AudioContext with GainNode for master volume control
- **Spatial Audio**: PannerNode with HRTF for 3D positional/directional sound (x, y, z coordinates)
- **MSP Protocol**: Parses !!SOUND(name vol=50 loop=-1) and !!MUSIC() triggers from MUD output
- **Soundpacks**: Upload/organize sound files; select active pack; sounds are preloaded on pack change
- **Lua Sound API**: playSound(name, volume, loop), stopSound(name), loopSound(name, volume), setSoundPosition(name, x, y, z)

### AI Script Assistant
- **Unified Chat Interface**: Single Script Assistant dialog accessible from Play screen toolbar (Wand icon)
- **Conversational AI**: Describe scripting needs in plain language, AI generates complete Lua automation
- **User API Key Required**: Users must provide their own OpenAI API key in Settings to use this feature
- **Direct Creation**: Generated scripts can be added directly as triggers, aliases, timers, keybindings, or buttons
- **Comprehensive Context**: System prompt includes full Lua API documentation, sound system, spatial audio
- **Code Block Parsing**: AI outputs structured code blocks with metadata for one-click creation
- **Server Endpoint**: /api/ai/script-assistant uses streaming SSE for real-time responses
- **API Key Storage**: Settings page allows storing personal OpenAI API key
  - Local storage (unencrypted, convenient)
  - Password-encrypted (AES-GCM with PBKDF2, unlocked per session)

### Accessibility Keyboard Shortcuts
- **Ctrl+1 through Ctrl+9**: Read the 1st through 9th most recent line via text-to-speech
- **Ctrl Ctrl (double-tap)**: Toggle pause/resume of speech synthesis (double-tap avoids conflicts with screen reader modifiers like VoiceOver's Ctrl+Option)
- **Escape**: Clear the input line
- **Keep Input on Send**: Optional setting to preserve input after pressing Enter (Escape clears it manually)
- All interactive elements have proper ARIA labels for screen reader compatibility
- **Strip Symbols Setting**: Removes decorative characters (box drawing, ASCII art) for cleaner screen reader output
- **Speech Controls**: Rate, volume, and pitch adjustable via settings
- **Speech Interruption Options**:
  - Interrupt on keypress: Stop speech when typing
  - Interrupt on send: Stop speech when pressing Enter (default on)
  - Interrupt on incoming: Stop speech when new text arrives from MUD

### Settings Architecture
- **Global Settings**: App-wide defaults stored in global_settings table (single row)
  - Speech: speechEnabled, speechRate, speechVolume, speechPitch, speechVoice
  - Speech Interruption: interruptOnKeypress, interruptOnSend, interruptOnIncoming
  - Display: fontScale, lineHeight, highContrast, readerMode, showInputEcho, stripSymbols
  - Automation: triggersEnabled, aliasesEnabled
  - Connection: autoReconnect, reconnectDelay, keepAlive, keepAliveInterval, gmcpEnabled
- **Profile Settings**: Per-MUD overrides stored in profiles.settings column
  - Null/undefined values inherit from global defaults
  - mergeSettings() function combines global + profile settings
  - Override indicators show which settings are customized for this profile
  - Reset button allows reverting to global default
- **Settings UI**: /settings page with two main tabs:
  - Global Defaults: Category tabs for Speech, Display, Automation, Connection, AI
  - Per-MUD Settings: Select a profile, then configure with category tabs
- **In-Game Commands**: All config commands use `/config {feature} {option}` format:
  - /help - Show quick reference guide (points to F1 for full wiki)
  - /config speech on|off - Toggle text-to-speech
  - /config rate <0.5-2> - Set speech rate
  - /config volume <0-100> - Set speech volume
  - /config pitch <0.5-2> - Set speech pitch
  - /config voice - List available voices or set by number
  - /config settings - Open settings panel
  - /config triggers on|off - Toggle trigger processing
  - /config aliases on|off - Toggle alias processing
  - /config reader on|off - Toggle reader mode
  - /config keep on|off - Toggle keeping input after Enter (use Escape to clear)
  - /config prefix <char> - Change command prefix (e.g., # instead of /)

### Help System
- **Quick Help (/help command)**: Brief in-terminal reference with key commands and shortcuts
- **Help Wiki (F1 or /help page)**: Comprehensive documentation with:
  - Getting Started guide
  - Speech & TTS configuration
  - Keyboard shortcuts reference
  - Client commands reference
  - Lua scripting documentation
  - Triggers & aliases guide
  - Sound system documentation
  - Package manager guide
  - AI Script Assistant usage
  - Settings configuration

### GMCP Support
- Generic MUD Communication Protocol for structured data from MUD servers
- Telnet option negotiation (option 201) handled in WebSocket relay
- Supports Core.Hello, Char.Vitals, Room.Info modules
- GMCP data displayed in terminal and stored in gmcpData state for UI display

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database access with drizzle-zod for schema validation
- **connect-pg-simple**: Session storage in PostgreSQL

### MUD Protocol Support
- **WebSocket (ws)**: Server-side WebSocket for relay service
- **net module**: Direct TCP connections from server to MUD servers
- **GMCP (implemented)**: Generic MUD Communication Protocol via telnet option 201
- Planned support for TLS, MCCP (compression)

### UI Framework
- **Radix UI**: Accessible primitives for dialogs, dropdowns, forms, etc.
- **shadcn/ui**: Pre-built component library using Radix + Tailwind
- **Framer Motion**: Animations for UI elements
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Replit plugins**: Development banner, cartographer, and error overlay for Replit environment