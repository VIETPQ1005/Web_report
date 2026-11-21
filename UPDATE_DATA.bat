@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================================
echo   CYBERPULSE // TU DONG DONG BO DU LIEU GOC LEN WEB NETLIFY
echo ====================================================================
echo.
echo [1/2] Dang quet tat ca file .xlsx trong D:\Project_AI\Website\data\ va day len Web Live...
python scripts\build_data.py --push-url https://web-report-47sq.netlify.app
if errorlevel 1 (
    echo.
    echo [CANH BAO] Khong day truc tiep len Netlify Cloud duoc - dang tiep tuc dong bo qua GitHub...
    python scripts\build_data.py
)
echo.
echo [2/2] Dang dong bo ban goc len GitHub (main)...
git add public/data/report_data.json public/data/report_data.js
git commit -m "chore(data): auto-sync latest Sales & Inventory data"
git push origin main
echo.
echo ====================================================================
echo   HOAN TAT! Du lieu moi nhat da duoc cap nhat len Web.
echo ====================================================================
pause
