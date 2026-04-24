@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   ODZA Backend Environment Setup
echo ========================================
echo.

set ENV_FILE=.env
set VALID=0

REM Step 1
call :step "Checking current directory..."
echo [FOLDER] Current directory: %CD%
echo.

REM Step 2
if exist %ENV_FILE% (
    call :step "Checking existing .env file..."
    echo [CHECK] Found .env file at: %CD%\%ENV_FILE%
    
    call :step "Validating Firebase API key..."
    findstr /B "FIREBASE_API_KEY=AIza" %ENV_FILE% >nul
    if not errorlevel 1 (
        set VALID=1
        echo [OK] Valid Firebase API key found!
        
        for /f "tokens=2 delims==" %%a in ('findstr /B "FIREBASE_API_KEY=" %ENV_FILE%') do (
            set "API_KEY=%%a"
        )
        echo [INFO] Current API key starts with: !API_KEY:~0,20!...
        echo.
        echo [DONE] Your .env is already configured correctly.
        echo        No changes needed.
        goto :end
    ) else (
        echo [WARNING] .env exists but has NO valid Firebase API key
        echo.
        choice /C YN /M "Delete this invalid .env file? "
        if not errorlevel 2 (
            call :step "Deleting invalid .env file..."
            del %ENV_FILE%
            echo [OK] Deleted invalid .env file
            echo.
        )
    )
) else (
    call :step "Checking for existing .env..."
    echo [OK] No existing .env found in %CD%
    echo.
)

:create_new
echo [INPUT] Enter Firebase API Key:
echo.

:ask_key
set "FIREBASE_API_KEY="
set /p "FIREBASE_API_KEY=API Key: "

if "%FIREBASE_API_KEY%"=="" (
    echo [ERROR] API key cannot be empty!
    echo.
    goto :ask_key
)

call :step "Validating API key format..."
echo %FIREBASE_API_KEY% | findstr /B "AIza" >nul
if errorlevel 1 (
    echo [WARNING] API key doesn't look like a Firebase key (should start with AIza)
    choice /C YN /M "Continue anyway? "
    if errorlevel 2 goto :ask_key
)

echo.
call :step "Creating .env file..."

(
echo # PostgreSQL Configuration
echo DB_USER=postgres
echo DB_PASSWORD=postgres
echo DB_HOST=postgres
echo DB_PORT=5432
echo DB_NAME=odza_users
echo.
echo # JWT Configuration
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo.
echo # Session Configuration
echo SESSION_EXPIRY_HOURS=8
echo.
echo # Server Configuration
echo PORT=3000
echo NODE_ENV=development
echo.
echo # Firebase Configuration
echo FIREBASE_API_KEY=%FIREBASE_API_KEY%
echo FIREBASE_AUTH_DOMAIN=flowpro-wms.firebaseapp.com
echo FIREBASE_PROJECT_ID=flowpro-wms
echo FIREBASE_STORAGE_BUCKET=flowpro-wms.firebasestorage.app
echo FIREBASE_MESSAGING_SENDER_ID=499934598299
echo FIREBASE_APP_ID=1:499934598299:web:01b3505f38b7b601bc223e
) > %ENV_FILE%

echo [OK] .env created at: %CD%\%ENV_FILE%

:end
echo.
call :step "Preparing next steps..."
echo [NEXT] Next steps:
echo    1. Run: docker-compose down
echo    2. Run: docker-compose up --build
echo.

pause
exit /b

REM ========== STEP FUNCTION ==========
:step
set "msg=%~1"
echo ▶ %msg%
ping -n 2 127.0.0.1 >nul
exit /b