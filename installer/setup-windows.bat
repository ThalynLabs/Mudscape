@echo off
REM ============================================================
REM  Mudscape Setup Script for Windows
REM  Double-click this file to run it.
REM ============================================================

title Mudscape Setup

setlocal enabledelayedexpansion

set "INSTALL_DIR=%USERPROFILE%\Mudscape"
set "DB_NAME=mudscape"
set "DB_USER="
set "DB_PASS="
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "APP_PORT=5000"
set "ACCOUNT_MODE="
set "ADMIN_USER="
set "ADMIN_PASS="
set "SESSION_SECRET="

cls
echo.
echo ========================================
echo    Mudscape Setup - Windows
echo ========================================
echo.
echo   This script will walk you through setting up Mudscape
echo   on your PC. It will ask questions along the way so
echo   you stay in control of what gets installed.
echo.
echo   Tip: Press Enter to accept the default value shown in [brackets].
echo.
pause

REM ============================================================
echo.
echo --- 1/7 - Checking Your System ---
echo.

REM Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo   [OK] Windows detected

REM ============================================================
echo.
echo --- 2/7 - Node.js ---
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
    echo   [OK] Node.js !NODE_VER! installed
    
    for /f "tokens=1 delims=." %%m in ("!NODE_VER:~1!") do set NODE_MAJOR=%%m
    if !NODE_MAJOR! LSS 18 (
        echo   [!] Node.js !NODE_VER! is too old, need v18+
        set NEED_NODE=1
    )
) else (
    echo   [!] Node.js not found
    set NEED_NODE=1
)

if defined NEED_NODE (
    echo.
    set /p INSTALL_NODE="  Install Node.js 20? (y/n) [y]: "
    if "!INSTALL_NODE!"=="" set INSTALL_NODE=y
    
    if /i "!INSTALL_NODE!"=="y" (
        echo.
        echo   Downloading Node.js 20 installer...
        echo.
        
        powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-setup.msi' }"
        
        if exist "%TEMP%\node-setup.msi" (
            echo   Running Node.js installer...
            echo   Follow the installer prompts. Default settings are fine.
            echo.
            start /wait msiexec /i "%TEMP%\node-setup.msi"
            del "%TEMP%\node-setup.msi"
            
            REM Refresh PATH
            set "PATH=%PATH%;C:\Program Files\nodejs"
            
            where node >nul 2>nul
            if !errorlevel! equ 0 (
                echo   [OK] Node.js installed
            ) else (
                echo   [!] Node.js may need a restart to be available.
                echo   Close this window, restart your computer, then run this script again.
                pause
                exit /b 1
            )
        ) else (
            echo   [X] Download failed.
            echo   Please install Node.js manually from https://nodejs.org
            pause
            exit /b 1
        )
    ) else (
        echo   [X] Node.js is required. Cannot continue without it.
        pause
        exit /b 1
    )
)

REM ============================================================
echo.
echo --- 3/7 - PostgreSQL ---
echo.

where psql >nul 2>nul
if %errorlevel% equ 0 (
    echo   [OK] PostgreSQL client found
    
    pg_isready >nul 2>nul
    if !errorlevel! equ 0 (
        echo   [OK] PostgreSQL server is running
        set PG_RUNNING=1
    ) else (
        echo   [!] PostgreSQL installed but not running
    )
) else (
    echo   [!] PostgreSQL not found
)

if not defined PG_RUNNING (
    where psql >nul 2>nul
    if !errorlevel! neq 0 (
        echo.
        set /p INSTALL_PG="  Install PostgreSQL? (y/n) [y]: "
        if "!INSTALL_PG!"=="" set INSTALL_PG=y
        
        if /i "!INSTALL_PG!"=="y" (
            echo.
            echo   Downloading PostgreSQL 15 installer...
            echo.
            
            powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64.exe' -OutFile '%TEMP%\pg-setup.exe' }"
            
            if exist "%TEMP%\pg-setup.exe" (
                echo   Running PostgreSQL installer...
                echo   IMPORTANT: Remember the password you set during installation!
                echo.
                start /wait "%TEMP%\pg-setup.exe"
                del "%TEMP%\pg-setup.exe"
                
                REM Add common PostgreSQL paths
                if exist "C:\Program Files\PostgreSQL\15\bin" set "PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin"
                if exist "C:\Program Files\PostgreSQL\16\bin" set "PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin"
                if exist "C:\Program Files\PostgreSQL\17\bin" set "PATH=%PATH%;C:\Program Files\PostgreSQL\17\bin"
                
                echo.
                echo   [OK] PostgreSQL installer completed
            ) else (
                echo   [X] Download failed.
                echo   Install PostgreSQL manually from https://www.postgresql.org/download/windows/
                pause
                exit /b 1
            )
        ) else (
            echo   [X] PostgreSQL is required. Cannot continue without it.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo   Try starting PostgreSQL from the Start Menu or Services.
        set /p PG_STARTED="  Is PostgreSQL running now? (y/n): "
        if /i not "!PG_STARTED!"=="y" (
            echo   Please start PostgreSQL and re-run this script.
            pause
            exit /b 1
        )
    )
    
    REM Wait for PostgreSQL to accept connections (up to 30 seconds)
    pg_isready >nul 2>nul
    if !errorlevel! equ 0 (
        echo   [OK] PostgreSQL is running
    ) else (
        set /a PG_WAIT=0
        echo.
        set /p "=  Waiting for PostgreSQL to accept connections..." <nul
        :pg_wait_loop
        if !PG_WAIT! geq 30 goto pg_wait_done
        pg_isready >nul 2>nul
        if !errorlevel! equ 0 (
            echo  ready!
            echo   [OK] PostgreSQL is running
            goto pg_ready
        )
        set /p "=." <nul
        timeout /t 1 /nobreak >nul
        set /a PG_WAIT+=1
        goto pg_wait_loop
        :pg_wait_done
        echo  timed out.
        echo   [!] PostgreSQL did not respond within 30 seconds
        echo.
        echo   You can try:
        echo     1. Re-run this script ^(it may just need more time^)
        echo     2. Start PostgreSQL from Services ^(services.msc^)
        echo     3. Check if the PostgreSQL service is installed
        echo.
        set /p CONTINUE_ANYWAY="  Try to continue anyway? (y/n) [y]: "
        if "!CONTINUE_ANYWAY!"=="" set CONTINUE_ANYWAY=y
        if /i not "!CONTINUE_ANYWAY!"=="y" (
            pause
            exit /b 1
        )
        :pg_ready
    )
)

REM ============================================================
echo.
echo --- 4/7 - Database Configuration ---
echo.

echo   Mudscape needs a PostgreSQL database to store profiles,
echo   settings, and user accounts.
echo.

set /p DB_USER="  PostgreSQL username [postgres]: "
if "!DB_USER!"=="" set DB_USER=postgres

set /p DB_PASS="  PostgreSQL password: "

set /p DB_HOST_IN="  Database host [localhost]: "
if "!DB_HOST_IN!"=="" set DB_HOST_IN=localhost
set DB_HOST=!DB_HOST_IN!

set /p DB_PORT_IN="  Database port [5432]: "
if "!DB_PORT_IN!"=="" set DB_PORT_IN=5432
set DB_PORT=!DB_PORT_IN!

echo.
echo   Creating database '%DB_NAME%'...

set "PGPASSWORD=!DB_PASS!"
createdb -U "!DB_USER!" -h "!DB_HOST!" -p "!DB_PORT!" "!DB_NAME!" 2>nul
if !errorlevel! equ 0 (
    echo   [OK] Database '%DB_NAME%' created
) else (
    echo   [!] Database may already exist or credentials need checking
    
    psql -U "!DB_USER!" -h "!DB_HOST!" -p "!DB_PORT!" -d "!DB_NAME!" -c "SELECT 1;" >nul 2>nul
    if !errorlevel! equ 0 (
        echo   [OK] Existing database '%DB_NAME%' is accessible
    ) else (
        echo   [X] Cannot connect to database. Check your credentials.
        pause
        exit /b 1
    )
)

if "!DB_PASS!"=="" (
    set "DATABASE_URL=postgresql://!DB_USER!@!DB_HOST!:!DB_PORT!/!DB_NAME!"
) else (
    set "DATABASE_URL=postgresql://!DB_USER!:!DB_PASS!@!DB_HOST!:!DB_PORT!/!DB_NAME!"
)

REM ============================================================
echo.
echo --- 5/7 - Application Settings ---
echo.

echo   Choose how Mudscape handles user access.
echo.
echo   1) Single-user mode  - No login needed, just you
echo   2) Multi-user mode   - Accounts with login required
echo.

:mode_choice
set /p MODE_CHOICE="  Choose mode (1 or 2) [1]: "
if "!MODE_CHOICE!"=="" set MODE_CHOICE=1
if "!MODE_CHOICE!"=="1" (
    set ACCOUNT_MODE=single
) else if "!MODE_CHOICE!"=="2" (
    set ACCOUNT_MODE=multi
) else (
    echo   Please enter 1 or 2.
    goto mode_choice
)

if "!ACCOUNT_MODE!"=="multi" (
    echo.
    echo   Create your admin account.
    echo.
    set /p ADMIN_USER="  Admin username [admin]: "
    if "!ADMIN_USER!"=="" set ADMIN_USER=admin
    set /p ADMIN_PASS="  Admin password: "
)

echo.
set /p APP_PORT_IN="  Port for Mudscape [5000]: "
if "!APP_PORT_IN!"=="" set APP_PORT_IN=5000
set APP_PORT=!APP_PORT_IN!

REM Generate session secret
for /f "tokens=*" %%s in ('powershell -Command "[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]).Substring(0,64)"') do set SESSION_SECRET=%%s
echo   [OK] Session secret generated

REM ============================================================
echo.
echo --- 6/7 - Installing Mudscape ---
echo.

REM Detect if script is being run from inside an existing Mudscape project
set "SCRIPT_DIR=%~dp0"
set "SOURCE_DIR="

REM Check if script lives inside a Mudscape project (installer/ subfolder)
if exist "%SCRIPT_DIR%..\package.json" (
    findstr /i "mudscape" "%SCRIPT_DIR%..\package.json" >nul 2>nul
    if !errorlevel! equ 0 (
        pushd "%SCRIPT_DIR%.."
        set "SOURCE_DIR=!CD!"
        popd
    )
)

REM Check if script is in the project root
if not defined SOURCE_DIR (
    if exist "%SCRIPT_DIR%package.json" (
        findstr /i "mudscape" "%SCRIPT_DIR%package.json" >nul 2>nul
        if !errorlevel! equ 0 set "SOURCE_DIR=%SCRIPT_DIR%"
    )
)

if defined SOURCE_DIR (
    echo   Found Mudscape project at: !SOURCE_DIR!
    echo.
    echo   You can install Mudscape directly here, or copy it
    echo   to a different location.
    echo.
    set /p USE_SOURCE="  Install in the current project folder? (y/n) [y]: "
    if "!USE_SOURCE!"=="" set USE_SOURCE=y
    if /i "!USE_SOURCE!"=="y" (
        set "INSTALL_DIR=!SOURCE_DIR!"
        echo   [OK] Using existing project files
    ) else (
        set /p INSTALL_DIR_IN="  Installation folder [!INSTALL_DIR!]: "
        if not "!INSTALL_DIR_IN!"=="" set INSTALL_DIR=!INSTALL_DIR_IN!
        if not "!SOURCE_DIR!"=="!INSTALL_DIR!" (
            echo   Copying project files to !INSTALL_DIR!...
            mkdir "!INSTALL_DIR!" 2>nul
            xcopy "!SOURCE_DIR!\*" "!INSTALL_DIR!\" /E /I /Y /EXCLUDE:node_modules >nul 2>nul
            rmdir /s /q "!INSTALL_DIR!\node_modules" 2>nul
            rmdir /s /q "!INSTALL_DIR!\.git" 2>nul
            rmdir /s /q "!INSTALL_DIR!\dist" 2>nul
            echo   [OK] Files copied to !INSTALL_DIR!
        )
    )
) else (
    set /p INSTALL_DIR_IN="  Installation folder [!INSTALL_DIR!]: "
    if not "!INSTALL_DIR_IN!"=="" set INSTALL_DIR=!INSTALL_DIR_IN!
    
    REM Check if project already exists at target
    if exist "!INSTALL_DIR!\package.json" (
        findstr /i "mudscape" "!INSTALL_DIR!\package.json" >nul 2>nul
        if !errorlevel! equ 0 (
            echo   [OK] Mudscape already exists at !INSTALL_DIR!
            if exist "!INSTALL_DIR!\.git" (
                set /p DO_UPDATE="  Update to latest version? (y/n) [y]: "
                if "!DO_UPDATE!"=="" set DO_UPDATE=y
                if /i "!DO_UPDATE!"=="y" (
                    cd /d "!INSTALL_DIR!"
                    git pull origin main 2>nul
                    if !errorlevel! equ 0 (
                        echo   [OK] Updated
                    ) else (
                        echo   [!] Could not update ^(no remote configured or offline^)
                    )
                )
            )
            goto install_deps
        )
    )
    
    echo   Downloading Mudscape...
    set "DOWNLOAD_OK=n"
    
    REM Try git clone first
    where git >nul 2>nul
    if !errorlevel! equ 0 (
        git clone https://github.com/ThalynLabs/Mudscape.git "!INSTALL_DIR!" 2>nul
        if exist "!INSTALL_DIR!\package.json" (
            set "DOWNLOAD_OK=y"
            echo   [OK] Downloaded via git
        )
    )
    
    REM Try zip download as fallback
    if "!DOWNLOAD_OK!"=="n" (
        mkdir "!INSTALL_DIR!" 2>nul
        powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://github.com/ThalynLabs/Mudscape/archive/refs/heads/main.zip' -OutFile '%TEMP%\mudscape.zip' -ErrorAction Stop } catch { exit 1 } }" 2>nul
        if exist "%TEMP%\mudscape.zip" (
            powershell -Command "& { Expand-Archive -Path '%TEMP%\mudscape.zip' -DestinationPath '%TEMP%\mudscape-extract' -Force }" 2>nul
            xcopy "%TEMP%\mudscape-extract\mudscape-main\*" "!INSTALL_DIR!\" /E /I /Y >nul 2>nul
            rmdir /s /q "%TEMP%\mudscape-extract" 2>nul
            del "%TEMP%\mudscape.zip" 2>nul
            if exist "!INSTALL_DIR!\package.json" (
                set "DOWNLOAD_OK=y"
                echo   [OK] Downloaded via archive
            )
        )
    )
    
    if "!DOWNLOAD_OK!"=="n" (
        rmdir "!INSTALL_DIR!" 2>nul
        echo   [X] Could not download Mudscape
        echo.
        echo   The GitHub repository may be private or unavailable.
        echo.
        echo   Instead, you can run this installer from inside an
        echo   existing Mudscape project folder. For example:
        echo.
        echo     1. Download or unzip the Mudscape source code
        echo     2. Double-click installer\setup-windows.bat
        echo.
        echo   The installer will detect the project and set it up.
        pause
        exit /b 1
    )
)

:install_deps
cd /d "!INSTALL_DIR!"

REM Write .env file
(
echo DATABASE_URL=!DATABASE_URL!
echo SESSION_SECRET=!SESSION_SECRET!
echo PORT=!APP_PORT!
echo NODE_ENV=production
if "!ACCOUNT_MODE!"=="single" echo SINGLE_USER_MODE=true
) > .env

echo   [OK] Configuration saved

echo   Installing dependencies (this may take a minute)...
call npm install --silent 2>nul
echo   [OK] Dependencies installed

echo   Setting up database tables...
call npx drizzle-kit push 2>nul
if !errorlevel! equ 0 (
    echo   [OK] Database tables created
) else (
    echo   [!] Database setup had issues ^(may already be set up^)
)

echo   Building application...
call npm run build
if exist "dist\index.cjs" (
    echo   [OK] Application built
) else (
    echo   [X] Build failed
    echo.
    echo   You can try building manually later with: npm run build
    echo   The installer will continue, but Mudscape won't start
    echo   until the build succeeds.
    set BUILD_FAILED=1
)

REM Seed admin account if multi-user
if "!ACCOUNT_MODE!"=="multi" (
    if not "!ADMIN_USER!"=="" (
        echo   Creating admin account...
        node -e "const bcrypt=require('bcrypt');const {Pool}=require('pg');const pool=new Pool({connectionString:'!DATABASE_URL!'});(async()=>{const hash=await bcrypt.hash('!ADMIN_PASS!',10);await pool.query('INSERT INTO users (username, password, is_admin) VALUES ($1, $2, true) ON CONFLICT (username) DO NOTHING',['!ADMIN_USER!',hash]);await pool.end()})().catch(()=>{})" 2>nul
        echo   [OK] Admin account created
    )
)

REM Create start script
(
echo @echo off
echo title Mudscape
echo cd /d "!INSTALL_DIR!"
echo echo Starting Mudscape...
echo start http://localhost:!APP_PORT!
echo node dist/index.cjs
echo pause
) > "!INSTALL_DIR!\Mudscape-Start.bat"

echo   [OK] Start script created

REM ============================================================
echo.
echo --- 7/7 - Setup Complete ---
echo.
echo   ========================================
echo     Mudscape has been installed!
echo   ========================================
echo.
echo   Location:  !INSTALL_DIR!
echo   URL:       http://localhost:!APP_PORT!
echo.
echo   To start Mudscape:
echo     Double-click Mudscape-Start.bat in !INSTALL_DIR!
echo.

if "!ACCOUNT_MODE!"=="multi" (
    echo   Admin account: !ADMIN_USER!
    echo.
)

if defined BUILD_FAILED (
    echo   [!] Mudscape was installed but the build failed.
    echo   Fix the build issue, then start with: node dist/index.cjs
) else (
    set /p START_NOW="  Start Mudscape now? (y/n) [y]: "
    if "!START_NOW!"=="" set START_NOW=y
    if /i "!START_NOW!"=="y" (
        echo.
        echo   Starting Mudscape...
        start http://localhost:!APP_PORT!
        node dist/index.cjs
    )
)

pause
