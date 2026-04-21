@echo off
cd /d "F:\Yalla Test Client"

echo ========================================
echo   Octobot - Update and Restart Script
echo ========================================
echo.

echo [1/3] Pulling latest changes from GitHub...
echo ----------------------------------------
git pull origin main
echo.

echo [2/3] Building the project...
echo ----------------------------------------
pnpm run build
echo.

echo [3/3] Restarting PM2 process...
echo ----------------------------------------
pm2 restart dk-octobot
echo.

echo ========================================
echo   All done!
echo ========================================
echo.
pause
