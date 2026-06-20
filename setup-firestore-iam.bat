@echo off
REM Firestore Rules IAM Setup Script (Windows)
REM This script grants the required IAM roles to the Firebase service account

setlocal enabledelayedexpansion

set PROJECT_ID=weekend-warrior-social-ed3d0
set SERVICE_ACCOUNT_EMAIL=firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com

echo ==========================================
echo Firestore Rules IAM Setup
echo ==========================================
echo.
echo Project ID: %PROJECT_ID%
echo Service Account: %SERVICE_ACCOUNT_EMAIL%
echo.

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X gcloud CLI is not installed.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo [OK] gcloud CLI found
echo.

REM Check if authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Not authenticated with gcloud
    echo Run: gcloud auth login
    pause
    exit /b 1
)

echo [OK] Authenticated with gcloud
echo.

REM Confirm project access
gcloud projects describe %PROJECT_ID% >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X No access to project: %PROJECT_ID%
    echo Ensure you have Project Editor or Owner role
    pause
    exit /b 1
)

echo [OK] Project access confirmed
echo.

echo Choose an option:
echo.
echo 1) Firebase Admin (full permissions - simpler)
echo 2) Firebase Rules Admin + Firestore Admin (least privilege - secure)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Setting up: Firebase Admin role...
    echo.

    gcloud projects add-iam-policy-binding %PROJECT_ID% ^
        --member=serviceAccount:%SERVICE_ACCOUNT_EMAIL% ^
        --role=roles/firebase.admin ^
        --quiet

    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [OK] Firebase Admin role assigned
    ) else (
        echo X Failed to assign role
        pause
        exit /b 1
    )

) else if "%choice%"=="2" (
    echo.
    echo Setting up: Firebase Rules Admin + Firestore Admin roles...
    echo.

    echo Assigning Firebase Rules Admin...
    gcloud projects add-iam-policy-binding %PROJECT_ID% ^
        --member=serviceAccount:%SERVICE_ACCOUNT_EMAIL% ^
        --role=roles/firebase.rulesAdmin ^
        --quiet

    if %ERRORLEVEL% NEQ 0 (
        echo X Failed to assign Firebase Rules Admin
        pause
        exit /b 1
    )

    echo [OK] Firebase Rules Admin role assigned
    echo.

    echo Assigning Firestore Admin...
    gcloud projects add-iam-policy-binding %PROJECT_ID% ^
        --member=serviceAccount:%SERVICE_ACCOUNT_EMAIL% ^
        --role=roles/firestore.admin ^
        --quiet

    if %ERRORLEVEL% NEQ 0 (
        echo X Failed to assign Firestore Admin
        pause
        exit /b 1
    )

    echo [OK] Firestore Admin role assigned

) else (
    echo X Invalid choice
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for permissions to propagate
echo 2. Go to GitHub Actions:
echo    https://github.com/bvt2kzkbb9-art/weekend-warrior-social/actions/workflows/deploy-firestore-rules.yml
echo 3. Click 'Run workflow'
echo 4. Monitor the deployment
echo.
echo Verification:
echo View assigned roles:
echo gcloud projects get-iam-policy %PROJECT_ID% --flatten="bindings[].members" --filter="members:%SERVICE_ACCOUNT_EMAIL%"
echo.
pause
