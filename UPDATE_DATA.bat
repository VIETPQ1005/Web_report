@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================================
echo   CYBERPULSE // CAP NHAT DU LIEU EXCEL LEN GITHUB & NETLIFY
echo ====================================================================
echo.
echo [1/3] Dang doc tat ca file .xlsx trong thu muc data\ ...
python scripts\build_data.py
if errorlevel 1 (
    echo.
    echo [LOI] Khong the xu ly file Excel. Hay kiem tra lai thu muc data\.
    pause
    exit /b 1
)
echo.
echo [2/3] Dang commit du lieu moi vao Git ...
git add public/data/report_data.json public/data/report_data.js
git commit -m "chore(data): update sales report data from Excel"
echo.
echo [3/3] Dang day len GitHub (Netlify se tu dong deploy) ...
git push origin main
if errorlevel 1 (
    echo.
    echo [LOI] Khong the push len GitHub. Hay kiem tra ket noi mang hoac dang nhap Git.
    pause
    exit /b 1
)
echo.
echo ====================================================================
echo   HOAN TAT! Website tren Netlify se cap nhat trong ~15-30 giay.
echo ====================================================================
pause
