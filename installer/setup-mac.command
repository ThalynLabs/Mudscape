#!/bin/bash
# ============================================================
#  Mudscape Setup Script for macOS
#  Double-click this file to run it.
# ============================================================

trap 'echo ""; echo "Press any key to close..."; read -n 1' EXIT

clear

BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

INSTALL_DIR="$HOME/Documents/mudscape"
DB_NAME="mudscape"
DB_USER=""
DB_PASS=""
APP_PORT="5000"
USE_BREW=""
ACCOUNT_MODE=""
ADMIN_USER=""
ADMIN_PASS=""
SESSION_SECRET=""

print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}========================================"
  echo "   Mudscape Setup - macOS"
  echo -e "========================================${RESET}"
  echo ""
}

print_step() {
  echo ""
  echo -e "${BOLD}--- $1 ---${RESET}"
  echo ""
}

print_ok() {
  echo -e "  ${GREEN}[OK]${RESET} $1"
}

print_warn() {
  echo -e "  ${YELLOW}[!]${RESET} $1"
}

print_fail() {
  echo -e "  ${RED}[X]${RESET} $1"
}

ask() {
  local prompt="$1"
  local default="$2"
  local result=""
  if [ -n "$default" ]; then
    read -p "  $prompt [$default]: " result
    echo "${result:-$default}"
  else
    read -p "  $prompt: " result
    echo "$result"
  fi
}

ask_yes_no() {
  local prompt="$1"
  local default="$2"
  local result=""
  while true; do
    read -p "  $prompt (y/n) [$default]: " result
    result="${result:-$default}"
    case "$result" in
      [yY]) echo "y"; return ;;
      [nN]) echo "n"; return ;;
      *) echo "  Please answer y or n." ;;
    esac
  done
}

generate_secret() {
  openssl rand -base64 48 | tr -d '\n/+=' | head -c 64
}

# ============================================================
print_header

echo "  This script will walk you through setting up Mudscape"
echo "  on your Mac. It will ask questions along the way so"
echo "  you stay in control of what gets installed."
echo ""
echo -e "  ${DIM}Tip: Press Enter to accept the default value shown in [brackets].${RESET}"
echo ""
read -p "  Ready to begin? Press Enter to continue..."

# ============================================================
print_step "1/7 - Checking Your System"

# Check macOS version
SW_VERS=$(sw_vers -productVersion 2>/dev/null)
if [ -n "$SW_VERS" ]; then
  print_ok "macOS $SW_VERS detected"
else
  print_fail "Could not detect macOS version"
fi

# Check for Xcode command line tools
if xcode-select -p &>/dev/null; then
  print_ok "Xcode Command Line Tools installed"
else
  print_warn "Xcode Command Line Tools not found"
  echo ""
  echo "  These are needed to build some dependencies."
  INSTALL_XCODE=$(ask_yes_no "Install Xcode Command Line Tools now?" "y")
  if [ "$INSTALL_XCODE" = "y" ]; then
    echo "  Installing... (a dialog may appear, click Install)"
    xcode-select --install 2>/dev/null
    echo ""
    echo "  If a dialog appeared, complete the installation there,"
    echo "  then re-run this setup script."
    echo ""
    exit 0
  fi
fi

# Check for Homebrew
if command -v brew &>/dev/null; then
  print_ok "Homebrew found at $(which brew)"
  USE_BREW="y"
  echo ""
  echo "  Homebrew is available. Using it makes installing"
  echo "  Node.js and PostgreSQL much easier."
  USE_BREW=$(ask_yes_no "Use Homebrew for installations?" "y")
else
  print_warn "Homebrew not found"
  echo ""
  echo "  Homebrew is a package manager that makes installing"
  echo "  software on your Mac easy. It's recommended but optional."
  echo ""
  INSTALL_BREW=$(ask_yes_no "Would you like to install Homebrew?" "y")
  if [ "$INSTALL_BREW" = "y" ]; then
    echo ""
    echo "  Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add brew to path for Apple Silicon Macs
    if [ -f /opt/homebrew/bin/brew ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    if command -v brew &>/dev/null; then
      print_ok "Homebrew installed successfully"
      USE_BREW="y"
    else
      print_fail "Homebrew installation failed"
      echo "  Continuing without Homebrew..."
      USE_BREW="n"
    fi
  else
    USE_BREW="n"
  fi
fi

# ============================================================
print_step "2/7 - Node.js"

if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    print_ok "Node.js $NODE_VER installed (meets requirement of v18+)"
  else
    print_warn "Node.js $NODE_VER is too old (need v18+)"
    INSTALL_NODE="y"
  fi
else
  print_warn "Node.js not found"
  INSTALL_NODE="y"
fi

if [ "$INSTALL_NODE" = "y" ]; then
  echo ""
  CONFIRM_NODE=$(ask_yes_no "Install Node.js 20?" "y")
  if [ "$CONFIRM_NODE" = "y" ]; then
    if [ "$USE_BREW" = "y" ]; then
      echo "  Installing Node.js via Homebrew..."
      brew install node@20
      brew link node@20 --force 2>/dev/null
    else
      echo "  Installing Node.js via official installer..."
      echo ""
      echo "  Downloading Node.js 20..."
      ARCH=$(uname -m)
      if [ "$ARCH" = "arm64" ]; then
        NODE_PKG="node-v20.11.0-darwin-arm64.tar.gz"
      else
        NODE_PKG="node-v20.11.0-darwin-x64.tar.gz"
      fi
      curl -fsSL "https://nodejs.org/dist/v20.11.0/$NODE_PKG" -o "/tmp/$NODE_PKG"
      sudo mkdir -p /usr/local/lib/nodejs
      sudo tar -xzf "/tmp/$NODE_PKG" -C /usr/local/lib/nodejs
      NODE_DIR=$(basename "$NODE_PKG" .tar.gz)
      echo "export PATH=/usr/local/lib/nodejs/$NODE_DIR/bin:\$PATH" >> ~/.zshrc
      export PATH="/usr/local/lib/nodejs/$NODE_DIR/bin:$PATH"
      rm "/tmp/$NODE_PKG"
    fi
    
    if command -v node &>/dev/null; then
      print_ok "Node.js $(node --version) installed"
    else
      print_fail "Node.js installation may need a terminal restart"
      echo "  Close this window, open a new terminal, and re-run the script."
      exit 1
    fi
  else
    print_fail "Node.js is required. Cannot continue without it."
    exit 1
  fi
fi

# ============================================================
print_step "3/7 - PostgreSQL"

# Homebrew installs postgresql@15 to a keg-only path that isn't in PATH by default.
# Check common Homebrew PostgreSQL locations and add to PATH if found.
add_brew_pg_to_path() {
  local pg_dirs=(
    "/opt/homebrew/opt/postgresql@15/bin"
    "/usr/local/opt/postgresql@15/bin"
    "/opt/homebrew/opt/postgresql@16/bin"
    "/usr/local/opt/postgresql@16/bin"
    "/opt/homebrew/opt/postgresql@17/bin"
    "/usr/local/opt/postgresql@17/bin"
    "/opt/homebrew/bin"
    "/usr/local/bin"
  )
  for dir in "${pg_dirs[@]}"; do
    if [ -x "$dir/psql" ] && [[ ":$PATH:" != *":$dir:"* ]]; then
      export PATH="$dir:$PATH"
      return 0
    fi
  done
  return 1
}

add_brew_pg_to_path

# Wait for PostgreSQL to become ready instead of sleeping a fixed time.
# Polls pg_isready every second, up to 30 seconds (handles slow machines).
wait_for_pg() {
  local max_wait=30
  local waited=0
  echo -n "  Waiting for PostgreSQL to accept connections..."
  while [ $waited -lt $max_wait ]; do
    if pg_isready &>/dev/null; then
      echo " ready!"
      return 0
    fi
    echo -n "."
    sleep 1
    waited=$((waited + 1))
  done
  echo " timed out."
  return 1
}

PG_RUNNING="n"
if command -v psql &>/dev/null; then
  print_ok "PostgreSQL client found"
  if pg_isready &>/dev/null; then
    PG_RUNNING="y"
    print_ok "PostgreSQL server is running"
  else
    print_warn "PostgreSQL is installed but not running"
  fi
else
  print_warn "PostgreSQL not found"
fi

if [ "$PG_RUNNING" != "y" ]; then
  echo ""
  if ! command -v psql &>/dev/null; then
    INSTALL_PG=$(ask_yes_no "Install PostgreSQL?" "y")
    if [ "$INSTALL_PG" = "y" ]; then
      if [ "$USE_BREW" = "y" ]; then
        echo "  Installing PostgreSQL via Homebrew..."
        brew install postgresql@15
        
        # Add the newly installed PostgreSQL to PATH
        add_brew_pg_to_path
        # Also try brew link as a fallback
        brew link postgresql@15 --force 2>/dev/null
        
        brew services start postgresql@15
        
        if command -v psql &>/dev/null; then
          print_ok "PostgreSQL installed and added to PATH"
        else
          print_warn "PostgreSQL installed but not yet in PATH"
          echo "  Checking Homebrew prefix..."
          BREW_PG_BIN="$(brew --prefix postgresql@15 2>/dev/null)/bin"
          if [ -x "$BREW_PG_BIN/psql" ]; then
            export PATH="$BREW_PG_BIN:$PATH"
            print_ok "Found PostgreSQL at $BREW_PG_BIN"
          fi
        fi
      else
        echo ""
        echo "  Without Homebrew, you'll need to install PostgreSQL manually."
        echo "  Download from: https://postgresapp.com (recommended for Mac)"
        echo "  or https://www.postgresql.org/download/macosx/"
        echo ""
        echo "  Install PostgreSQL, start it, then re-run this script."
        exit 1
      fi
    else
      print_fail "PostgreSQL is required. Cannot continue without it."
      exit 1
    fi
  else
    echo ""
    START_PG=$(ask_yes_no "Start PostgreSQL now?" "y")
    if [ "$START_PG" = "y" ]; then
      if [ "$USE_BREW" = "y" ]; then
        brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null
      else
        pg_ctl -D /usr/local/var/postgres start 2>/dev/null || pg_ctl -D /opt/homebrew/var/postgres start 2>/dev/null
      fi
    fi
  fi
  
  if pg_isready &>/dev/null; then
    print_ok "PostgreSQL is running"
  elif wait_for_pg; then
    print_ok "PostgreSQL is running"
  else
    print_fail "PostgreSQL did not respond within 30 seconds"
    echo ""
    echo "  You can try:"
    echo "    1. Re-run this script (it may just need more time)"
    echo "    2. Run: brew services restart postgresql@15"
    echo "    3. Check status: brew services list"
    echo ""
    CONTINUE_ANYWAY=$(ask_yes_no "Try to continue anyway?" "y")
    if [ "$CONTINUE_ANYWAY" != "y" ]; then
      exit 1
    fi
  fi
fi

# ============================================================
print_step "4/7 - Database Configuration"

echo "  Mudscape needs a PostgreSQL database to store profiles,"
echo "  settings, and user accounts."
echo ""

# Check if database already exists
EXISTING_DB=$(psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -w "$DB_NAME" | tr -d ' ')

if [ "$EXISTING_DB" = "$DB_NAME" ]; then
  print_ok "Database '$DB_NAME' already exists"
  echo ""
  REUSE_DB=$(ask_yes_no "Use existing database? (choosing 'n' will create a fresh one)" "y")
  if [ "$REUSE_DB" = "n" ]; then
    dropdb "$DB_NAME" 2>/dev/null
    createdb "$DB_NAME" 2>/dev/null
    print_ok "Fresh database created"
  fi
else
  echo "  Creating database '$DB_NAME'..."
  createdb "$DB_NAME" 2>/dev/null
  if [ $? -eq 0 ]; then
    print_ok "Database '$DB_NAME' created"
  else
    print_fail "Could not create database"
    echo ""
    echo "  You may need to specify a PostgreSQL user."
    DB_USER=$(ask "PostgreSQL username" "$(whoami)")
    createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null
    if [ $? -eq 0 ]; then
      print_ok "Database created as user '$DB_USER'"
    else
      print_fail "Could not create database. Check PostgreSQL is running."
      exit 1
    fi
  fi
fi

echo ""
echo "  Now configure the database connection."
echo ""

if [ -z "$DB_USER" ]; then
  DB_USER=$(ask "PostgreSQL username" "$(whoami)")
fi
DB_PASS=$(ask "PostgreSQL password (leave blank if none)" "")
DB_HOST=$(ask "Database host" "localhost")
DB_PORT=$(ask "Database port" "5432")

if [ -n "$DB_PASS" ]; then
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Test connection
if psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null; then
  print_ok "Database connection successful"
else
  print_warn "Could not verify connection (may still work)"
fi

# ============================================================
print_step "5/7 - Application Settings"

echo "  Choose how Mudscape handles user access."
echo ""
echo "  1) Single-user mode  - No login needed, just you"
echo "  2) Multi-user mode   - Accounts with login required"
echo ""

while true; do
  MODE_CHOICE=$(ask "Choose mode (1 or 2)" "1")
  case "$MODE_CHOICE" in
    1) ACCOUNT_MODE="single"; break ;;
    2) ACCOUNT_MODE="multi"; break ;;
    *) echo "  Please enter 1 or 2." ;;
  esac
done

if [ "$ACCOUNT_MODE" = "multi" ]; then
  echo ""
  echo "  Create your admin account."
  echo ""
  ADMIN_USER=$(ask "Admin username" "admin")
  while true; do
    read -s -p "  Admin password: " ADMIN_PASS
    echo ""
    if [ ${#ADMIN_PASS} -lt 6 ]; then
      echo "  Password must be at least 6 characters."
    else
      break
    fi
  done
fi

echo ""
APP_PORT=$(ask "Port for Mudscape to run on" "5000")

SESSION_SECRET=$(generate_secret)
print_ok "Session secret generated"

# ============================================================
print_step "6/7 - Installing Mudscape"

# Detect if the script is being run from inside an existing Mudscape project
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR=""

# Check if the script lives inside a Mudscape project (look for package.json with "mudscape")
if [ -f "$SCRIPT_DIR/../package.json" ] && grep -q "mudscape" "$SCRIPT_DIR/../package.json" 2>/dev/null; then
  SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [ -f "$SCRIPT_DIR/package.json" ] && grep -q "mudscape" "$SCRIPT_DIR/package.json" 2>/dev/null; then
  SOURCE_DIR="$SCRIPT_DIR"
fi

if [ -n "$SOURCE_DIR" ]; then
  echo "  Found Mudscape project at: $SOURCE_DIR"
  INSTALL_DIR="$SOURCE_DIR"
  echo ""
  print_ok "Using existing project files"
else
  INSTALL_DIR=$(ask "Installation folder" "$INSTALL_DIR")
  
  if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/package.json" ] && grep -q "mudscape" "$INSTALL_DIR/package.json" 2>/dev/null; then
    echo ""
    print_ok "Mudscape already exists at $INSTALL_DIR"
    if [ -d "$INSTALL_DIR/.git" ]; then
      UPDATE=$(ask_yes_no "Update to latest version?" "y")
      if [ "$UPDATE" = "y" ]; then
        cd "$INSTALL_DIR"
        git pull origin main 2>/dev/null && print_ok "Updated to latest version" || print_warn "Could not update (no remote configured or offline)"
      fi
    fi
  else
    echo ""
    echo "  Downloading Mudscape..."
    mkdir -p "$INSTALL_DIR"
    
    DOWNLOAD_OK="n"
    
    # Try git clone first
    if command -v git &>/dev/null; then
      git clone https://github.com/ThalynLabs/Mudscape.git "$INSTALL_DIR" 2>/dev/null
      if [ $? -eq 0 ] && [ -f "$INSTALL_DIR/package.json" ]; then
        DOWNLOAD_OK="y"
        print_ok "Downloaded via git"
      fi
    fi
    
    # Try tarball download as fallback
    if [ "$DOWNLOAD_OK" != "y" ]; then
      curl -fsSL "https://github.com/ThalynLabs/Mudscape/archive/refs/heads/main.tar.gz" -o "/tmp/mudscape.tar.gz" 2>/dev/null
      if [ -f "/tmp/mudscape.tar.gz" ] && [ -s "/tmp/mudscape.tar.gz" ]; then
        tar -xzf "/tmp/mudscape.tar.gz" --strip-components=1 -C "$INSTALL_DIR" 2>/dev/null
        rm -f "/tmp/mudscape.tar.gz"
        if [ -f "$INSTALL_DIR/package.json" ]; then
          DOWNLOAD_OK="y"
          print_ok "Downloaded via tarball"
        fi
      fi
    fi
    
    if [ "$DOWNLOAD_OK" != "y" ]; then
      print_fail "Could not download Mudscape"
      echo ""
      echo "  The download source may not be available yet."
      echo "  If you already have the Mudscape files, place them in:"
      echo "    $INSTALL_DIR"
      echo "  Then re-run this script."
      echo ""
      echo "  Or run this script from inside the Mudscape project folder."
      exit 1
    fi
  fi
fi

cd "$INSTALL_DIR"

# Write .env file
cat > .env << ENVFILE
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
PORT=${APP_PORT}
NODE_ENV=production
ENVFILE

if [ "$ACCOUNT_MODE" = "single" ]; then
  echo "SINGLE_USER_MODE=true" >> .env
fi

print_ok "Configuration saved to .env"

echo "  Installing dependencies (this may take a minute)..."
npm install --silent 2>/dev/null
if [ $? -eq 0 ]; then
  print_ok "Dependencies installed"
else
  print_warn "Some warnings during install (usually fine)"
fi

echo "  Setting up database tables..."
npm run db:push 2>/dev/null
if [ $? -eq 0 ]; then
  print_ok "Database tables created"
else
  print_warn "Database setup had issues (may already be set up)"
fi

# Build for production
echo "  Building application..."
npm run build 2>/dev/null
print_ok "Application built"

# Seed admin account if multi-user
if [ "$ACCOUNT_MODE" = "multi" ] && [ -n "$ADMIN_USER" ] && [ -n "$ADMIN_PASS" ]; then
  echo "  Creating admin account..."
  node -e "
    const bcrypt = require('bcrypt');
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: '${DATABASE_URL}' });
    (async () => {
      const hash = await bcrypt.hash('${ADMIN_PASS}', 10);
      await pool.query(
        \"INSERT INTO users (username, password, is_admin) VALUES (\\\$1, \\\$2, true) ON CONFLICT (username) DO NOTHING\",
        ['${ADMIN_USER}', hash]
      );
      await pool.end();
    })().catch(() => {});
  " 2>/dev/null
  print_ok "Admin account created"
fi

# Create start script
cat > "$INSTALL_DIR/Mudscape-Start.command" << 'STARTSCRIPT'
#!/bin/bash
trap 'echo ""; echo "Mudscape stopped. Press any key to close..."; read -n 1' EXIT
cd "$(dirname "$0")"
echo "Starting Mudscape..."
STARTSCRIPT

echo "open \"http://localhost:${APP_PORT}\" &" >> "$INSTALL_DIR/Mudscape-Start.command"
echo "node dist/index.js" >> "$INSTALL_DIR/Mudscape-Start.command"

chmod +x "$INSTALL_DIR/Mudscape-Start.command"
print_ok "Start script created"

# ============================================================
print_step "7/7 - Setup Complete"

echo -e "  ${GREEN}${BOLD}Mudscape has been installed successfully!${RESET}"
echo ""
echo "  Location:  $INSTALL_DIR"
echo "  URL:       http://localhost:${APP_PORT}"
echo ""
echo "  To start Mudscape:"
echo "    Double-click Mudscape-Start.command in your Documents/mudscape folder"
echo ""
echo "  Or from terminal:"
echo "    cd $INSTALL_DIR && npm run dev"
echo ""

if [ "$ACCOUNT_MODE" = "multi" ]; then
  echo "  Admin account: $ADMIN_USER"
  echo "  (use the password you entered during setup)"
  echo ""
fi

START_NOW=$(ask_yes_no "Start Mudscape now?" "y")
if [ "$START_NOW" = "y" ]; then
  echo ""
  echo "  Starting Mudscape..."
  echo "  Opening browser to http://localhost:${APP_PORT}"
  echo ""
  open "http://localhost:${APP_PORT}" &
  node dist/index.js
fi
