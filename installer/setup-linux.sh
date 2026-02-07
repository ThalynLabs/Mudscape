#!/bin/bash
# ============================================================
#  Mudscape Setup Script for Linux
#  Run with: chmod +x setup-linux.sh && ./setup-linux.sh
# ============================================================

BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

INSTALL_DIR="$HOME/Mudscape"
DB_NAME="mudscape"
DB_USER=""
DB_PASS=""
DB_HOST="localhost"
DB_PORT="5432"
APP_PORT="5000"
ACCOUNT_MODE=""
ADMIN_USER=""
ADMIN_PASS=""
SESSION_SECRET=""
PKG_MANAGER=""

print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}========================================"
  echo "   Mudscape Setup - Linux"
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

detect_pkg_manager() {
  if command -v apt-get &>/dev/null; then
    PKG_MANAGER="apt"
  elif command -v dnf &>/dev/null; then
    PKG_MANAGER="dnf"
  elif command -v yum &>/dev/null; then
    PKG_MANAGER="yum"
  elif command -v pacman &>/dev/null; then
    PKG_MANAGER="pacman"
  elif command -v zypper &>/dev/null; then
    PKG_MANAGER="zypper"
  else
    PKG_MANAGER="unknown"
  fi
}

install_package() {
  local package="$1"
  case "$PKG_MANAGER" in
    apt) sudo apt-get install -y "$package" ;;
    dnf) sudo dnf install -y "$package" ;;
    yum) sudo yum install -y "$package" ;;
    pacman) sudo pacman -S --noconfirm "$package" ;;
    zypper) sudo zypper install -y "$package" ;;
    *) return 1 ;;
  esac
}

# ============================================================
print_header

echo "  This script will walk you through setting up Mudscape"
echo "  on your Linux machine. It will ask questions along the"
echo "  way so you stay in control of what gets installed."
echo ""
echo -e "  ${DIM}Tip: Press Enter to accept the default value shown in [brackets].${RESET}"
echo ""
read -p "  Ready to begin? Press Enter to continue..."

# ============================================================
print_step "1/7 - Checking Your System"

# Detect distro
if [ -f /etc/os-release ]; then
  . /etc/os-release
  print_ok "$PRETTY_NAME detected"
else
  print_warn "Could not detect Linux distribution"
fi

# Detect package manager
detect_pkg_manager
if [ "$PKG_MANAGER" != "unknown" ]; then
  print_ok "Package manager: $PKG_MANAGER"
else
  print_warn "Could not detect package manager"
  echo "  You may need to install dependencies manually."
fi

# Check for git
if command -v git &>/dev/null; then
  print_ok "Git installed"
else
  print_warn "Git not found"
  INSTALL_GIT=$(ask_yes_no "Install Git?" "y")
  if [ "$INSTALL_GIT" = "y" ]; then
    case "$PKG_MANAGER" in
      apt) sudo apt-get update && sudo apt-get install -y git ;;
      dnf|yum) install_package git ;;
      pacman) install_package git ;;
      zypper) install_package git ;;
      *) 
        print_fail "Cannot install Git automatically. Install it manually and re-run."
        exit 1
        ;;
    esac
    print_ok "Git installed"
  fi
fi

# Check for curl
if command -v curl &>/dev/null; then
  print_ok "curl installed"
else
  print_warn "curl not found, installing..."
  install_package curl
fi

# ============================================================
print_step "2/7 - Node.js"

INSTALL_NODE=""

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
    echo ""
    echo "  Choose installation method:"
    echo ""
    echo "  1) NodeSource repository (recommended)"
    echo "  2) Node Version Manager (nvm)"
    echo ""
    NODE_METHOD=$(ask "Choose method (1 or 2)" "1")
    
    if [ "$NODE_METHOD" = "2" ]; then
      echo "  Installing nvm..."
      curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
      nvm install 20
      nvm use 20
    else
      echo "  Adding NodeSource repository..."
      case "$PKG_MANAGER" in
        apt)
          curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
          sudo apt-get install -y nodejs
          ;;
        dnf|yum)
          curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
          install_package nodejs
          ;;
        pacman)
          install_package nodejs
          install_package npm
          ;;
        zypper)
          curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
          install_package nodejs
          ;;
        *)
          print_fail "Cannot install Node.js automatically."
          echo "  Visit https://nodejs.org and install manually."
          exit 1
          ;;
      esac
    fi
    
    if command -v node &>/dev/null; then
      print_ok "Node.js $(node --version) installed"
    else
      print_fail "Node.js installation may need a terminal restart"
      echo "  Close this terminal, open a new one, and re-run the script."
      exit 1
    fi
  else
    print_fail "Node.js is required. Cannot continue without it."
    exit 1
  fi
fi

# ============================================================
print_step "3/7 - PostgreSQL"

# Wait for PostgreSQL to become ready
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
      echo "  Installing PostgreSQL..."
      case "$PKG_MANAGER" in
        apt)
          sudo apt-get update
          sudo apt-get install -y postgresql postgresql-contrib
          ;;
        dnf)
          sudo dnf install -y postgresql-server postgresql-contrib
          sudo postgresql-setup --initdb 2>/dev/null || true
          ;;
        yum)
          sudo yum install -y postgresql-server postgresql-contrib
          sudo postgresql-setup initdb 2>/dev/null || true
          ;;
        pacman)
          install_package postgresql
          sudo -u postgres initdb -D /var/lib/postgres/data 2>/dev/null || true
          ;;
        zypper)
          install_package postgresql-server postgresql
          ;;
        *)
          print_fail "Cannot install PostgreSQL automatically."
          echo "  Install it manually and re-run this script."
          exit 1
          ;;
      esac
      
      sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null
      sudo systemctl enable postgresql 2>/dev/null || true
      print_ok "PostgreSQL installed"
    else
      print_fail "PostgreSQL is required. Cannot continue without it."
      exit 1
    fi
  else
    START_PG=$(ask_yes_no "Start PostgreSQL now?" "y")
    if [ "$START_PG" = "y" ]; then
      sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null
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
    echo "    2. Run: sudo systemctl restart postgresql"
    echo "    3. Check status: sudo systemctl status postgresql"
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

DB_USER=$(ask "PostgreSQL username" "$(whoami)")
echo ""
echo "  (Leave blank if using peer authentication)"
read -p "  PostgreSQL password: " DB_PASS
echo ""
DB_HOST=$(ask "Database host" "localhost")
DB_PORT=$(ask "Database port" "5432")

echo ""
echo "  Creating database '$DB_NAME'..."

# Try creating database
if [ -n "$DB_PASS" ]; then
  PGPASSWORD="$DB_PASS" createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" 2>/dev/null
else
  createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || sudo -u postgres createdb "$DB_NAME" 2>/dev/null
fi

CREATED=$?
if [ $CREATED -eq 0 ]; then
  print_ok "Database '$DB_NAME' created"
else
  print_warn "Database may already exist, checking..."
  if [ -n "$DB_PASS" ]; then
    PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null
  else
    psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null || sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" &>/dev/null
  fi
  
  if [ $? -eq 0 ]; then
    print_ok "Existing database '$DB_NAME' is accessible"
  else
    print_fail "Cannot connect to database. Check credentials."
    echo ""
    echo "  Common fix: Run as postgres user:"
    echo "    sudo -u postgres createdb $DB_NAME"
    echo "    sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD 'yourpass';\""
    echo "    sudo -u postgres psql -c \"GRANT ALL ON DATABASE $DB_NAME TO $DB_USER;\""
    exit 1
  fi
fi

if [ -n "$DB_PASS" ]; then
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
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

if [ -f "$SCRIPT_DIR/../package.json" ] && grep -q "mudscape" "$SCRIPT_DIR/../package.json" 2>/dev/null; then
  SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [ -f "$SCRIPT_DIR/package.json" ] && grep -q "mudscape" "$SCRIPT_DIR/package.json" 2>/dev/null; then
  SOURCE_DIR="$SCRIPT_DIR"
fi

if [ -n "$SOURCE_DIR" ]; then
  echo "  Found Mudscape project at: $SOURCE_DIR"
  echo ""
  echo "  You can install Mudscape directly here, or copy it"
  echo "  to a different location."
  echo ""
  USE_SOURCE=$(ask_yes_no "Install in the current project folder ($SOURCE_DIR)?" "y")
  if [ "$USE_SOURCE" = "y" ]; then
    INSTALL_DIR="$SOURCE_DIR"
    print_ok "Using existing project files"
  else
    INSTALL_DIR=$(ask "Installation folder" "$INSTALL_DIR")
    if [ "$SOURCE_DIR" != "$INSTALL_DIR" ]; then
      echo "  Copying project files to $INSTALL_DIR..."
      mkdir -p "$INSTALL_DIR"
      if command -v rsync &>/dev/null; then
        rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' "$SOURCE_DIR/" "$INSTALL_DIR/"
      else
        cp -R "$SOURCE_DIR/"* "$INSTALL_DIR/" 2>/dev/null
        cp "$SOURCE_DIR/".[!.]* "$INSTALL_DIR/" 2>/dev/null
        rm -rf "$INSTALL_DIR/node_modules" "$INSTALL_DIR/.git" "$INSTALL_DIR/dist" 2>/dev/null
      fi
      print_ok "Files copied to $INSTALL_DIR"
    fi
  fi
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
    
    if command -v git &>/dev/null; then
      echo "  Trying git clone..."
      git clone https://github.com/ThalynLabs/Mudscape.git "$INSTALL_DIR" 2>/dev/null
      if [ $? -eq 0 ] && [ -f "$INSTALL_DIR/package.json" ]; then
        DOWNLOAD_OK="y"
        print_ok "Downloaded via git"
      else
        print_warn "Git clone failed, trying alternate method..."
      fi
    fi
    
    if [ "$DOWNLOAD_OK" != "y" ]; then
      echo "  Trying tarball download..."
      curl -fsSL "https://github.com/ThalynLabs/Mudscape/archive/refs/heads/main.tar.gz" -o "/tmp/mudscape.tar.gz" 2>/dev/null
      if [ -f "/tmp/mudscape.tar.gz" ] && [ -s "/tmp/mudscape.tar.gz" ]; then
        tar -xzf "/tmp/mudscape.tar.gz" --strip-components=1 -C "$INSTALL_DIR" 2>/dev/null
        rm -f "/tmp/mudscape.tar.gz"
        if [ -f "$INSTALL_DIR/package.json" ]; then
          DOWNLOAD_OK="y"
          print_ok "Downloaded via tarball"
        fi
      else
        rm -f "/tmp/mudscape.tar.gz" 2>/dev/null
      fi
    fi
    
    if [ "$DOWNLOAD_OK" != "y" ]; then
      rmdir "$INSTALL_DIR" 2>/dev/null
      print_fail "Could not download Mudscape"
      echo ""
      echo "  The GitHub repository may be private or unavailable."
      echo ""
      echo "  Instead, you can run this installer from inside an"
      echo "  existing Mudscape project folder. For example:"
      echo ""
      echo "    1. Download or unzip the Mudscape source code"
      echo "    2. Open a terminal in that folder"
      echo "    3. Run: bash installer/setup-linux.sh"
      echo ""
      echo "  The installer will detect the project and set it up."
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
npm install 2>&1 | tail -5
if [ -d "node_modules" ]; then
  print_ok "Dependencies installed"
else
  print_fail "Failed to install dependencies"
  echo "  Try running 'npm install' manually in $INSTALL_DIR"
fi

echo "  Setting up database tables..."
npx drizzle-kit push 2>/dev/null
if [ $? -eq 0 ]; then
  print_ok "Database tables created"
else
  print_warn "Database setup had issues (may already be set up)"
fi

# Build
echo "  Building application..."
BUILD_OUTPUT=$(npm run build 2>&1)
if [ $? -eq 0 ] && [ -f "dist/index.cjs" ]; then
  print_ok "Application built"
else
  print_fail "Build failed"
  echo ""
  echo "  Build output:"
  echo "$BUILD_OUTPUT" | tail -20
  echo ""
  echo "  You can try building manually later with: npm run build"
  echo "  The installer will continue, but Mudscape won't start"
  echo "  until the build succeeds."
  BUILD_FAILED="y"
fi

# Seed admin account if multi-user
if [ "$ACCOUNT_MODE" = "multi" ] && [ -n "$ADMIN_USER" ] && [ -n "$ADMIN_PASS" ]; then
  echo "  Creating admin account..."
  node -e "
    const bcrypt = require('bcrypt');
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    (async () => {
      const hash = await bcrypt.hash(process.argv[1], 10);
      await pool.query(
        'INSERT INTO users (username, password, is_admin) VALUES (\$1, \$2, true) ON CONFLICT (username) DO NOTHING',
        [process.argv[2], hash]
      );
      await pool.end();
    })().catch(e => { console.error(e.message); process.exit(1); });
  " "$ADMIN_PASS" "$ADMIN_USER" 2>/dev/null
  if [ $? -eq 0 ]; then
    print_ok "Admin account created"
  else
    print_warn "Could not create admin account (you can register at first launch)"
  fi
fi

# Create start script
START_SCRIPT="$INSTALL_DIR/mudscape-start.sh"
cat > "$START_SCRIPT" << 'STARTSCRIPT'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "Error: .env file not found. Please run the setup script first."
  exit 1
fi

source .env 2>/dev/null
PORT="${PORT:-5000}"

echo ""
echo "Starting Mudscape on port $PORT..."
echo "Open http://localhost:$PORT in your browser."
echo "Press Ctrl+C to stop."
echo ""

node dist/index.cjs
STARTSCRIPT

chmod +x "$START_SCRIPT"
print_ok "Start script created: mudscape-start.sh"

# Offer systemd service
echo ""
INSTALL_SERVICE=$(ask_yes_no "Install as a systemd service (auto-start on boot)?" "n")
if [ "$INSTALL_SERVICE" = "y" ]; then
  NODE_PATH=$(which node)
  
  sudo tee /etc/systemd/system/mudscape.service > /dev/null << SVCFILE
[Unit]
Description=Mudscape MUD Client
After=network.target postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${INSTALL_DIR}
ExecStart=${NODE_PATH} dist/index.cjs
Restart=on-failure
RestartSec=10
EnvironmentFile=${INSTALL_DIR}/.env

[Install]
WantedBy=multi-user.target
SVCFILE

  sudo systemctl daemon-reload
  sudo systemctl enable mudscape
  sudo systemctl start mudscape
  print_ok "Systemd service installed and started"
  echo ""
  echo "  Manage with:"
  echo "    sudo systemctl status mudscape"
  echo "    sudo systemctl restart mudscape"
  echo "    sudo journalctl -u mudscape -f"
fi

# ============================================================
print_step "7/7 - Setup Complete"

echo -e "  ${GREEN}${BOLD}Mudscape has been installed successfully!${RESET}"
echo ""
echo "  Location:  $INSTALL_DIR"
echo "  URL:       http://localhost:${APP_PORT}"
echo ""

if [ "$INSTALL_SERVICE" = "y" ]; then
  echo "  Mudscape is running as a service and will start on boot."
  echo ""
else
  echo "  To start Mudscape:"
  echo "    cd $INSTALL_DIR && ./mudscape-start.sh"
  echo ""
fi

if [ "$ACCOUNT_MODE" = "multi" ]; then
  echo "  Admin account: $ADMIN_USER"
  echo "  (use the password you entered during setup)"
  echo ""
fi

if [ "$INSTALL_SERVICE" != "y" ]; then
  if [ "$BUILD_FAILED" = "y" ]; then
    echo ""
    print_warn "Mudscape was installed but the build failed."
    echo "  Fix the build issue, then start with: node dist/index.cjs"
  else
    START_NOW=$(ask_yes_no "Start Mudscape now?" "y")
    if [ "$START_NOW" = "y" ]; then
      echo ""
      echo "  Starting Mudscape on http://localhost:${APP_PORT}"
      echo ""
      xdg-open "http://localhost:${APP_PORT}" 2>/dev/null &
      node dist/index.cjs
    fi
  fi
fi
