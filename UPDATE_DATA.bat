@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================================
echo   CYBERPULSE // TU DONG DONG BO FULL DATA LEN GITHUB & NETLIFY
echo ====================================================================
echo.
echo [1/2] Dang quet toan bo file .xlsx trong D:\Project_AI\Website\data\ ...
python scripts\build_data.py
if errorlevel 1 (
    echo [LOI] Khong the build du lieu tu Excel.
    pause
    exit /b 1
)
echo.
echo [2/2] Dang dong bo Full Data len GitHub (Netlify tu dong deploy)...
git add -A public/data/
git commit -m "chore(data): sync latest Full Data (Sales + Inventory + Master + Serials)"
git push origin main
echo.
echo ====================================================================
echo   HOAN TAT! Website tren Netlify se cap nhat sau ~20 giay.
echo ====================================================================
pause
