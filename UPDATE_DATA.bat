@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================================
echo   CYBERPULSE // TU DONG DONG BO FULL DATA LEN GITHUB ^& NETLIFY
echo ====================================================================
echo.
echo [1/2] Dang quet toan bo file .xlsx trong D:\Project_AI\Website\data\ ...
python scripts\build_data.py
if errorlevel 1 (
    echo.
    echo [LOI] Khong the build du lieu tu Excel. Hay kiem tra cac file Excel dang mo hoac sai cau truc.
    pause
    exit /b 1
)
echo.
echo [2/2] Dang dong bo Full Data len GitHub (Netlify tu dong deploy)...
git config --global --add safe.directory "%~dp0" >nul 2>&1
git config --global --add safe.directory "D:/Project_AI/Website" >nul 2>&1
git -c safe.directory="%~dp0" add -A public/ public/data/ scripts/ netlify/
git -c safe.directory="%~dp0" commit -m "chore(data): sync latest Full Data"
git -c safe.directory="%~dp0" push origin main
if errorlevel 1 (
    echo.
    echo [CANH BAO] Khong the day len GitHub truc tiep (co the do mang). Hay thu chay lai sau giay lat.
) else (
    echo.
    echo ====================================================================
    echo   HOAN TAT! Website tren Netlify se cap nhat sau ~20 giay.
    echo ====================================================================
)
pause
