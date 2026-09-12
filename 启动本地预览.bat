@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 盛意通经营平台 Demo
echo.
echo 正在启动本地预览服务...
echo 访问地址：http://127.0.0.1:4173/
echo.

start "" "http://127.0.0.1:4173/"

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 4173 -d dist
  goto end
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 4173 -d dist
  goto end
)

echo 未检测到 Python，尝试使用 Node.js 预览。
where npx >nul 2>nul
if %errorlevel%==0 (
  npx vite preview --host 127.0.0.1 --port 4173
  goto end
)

echo.
echo 未检测到 Python 或 Node.js，无法自动启动本地服务。
echo 请安装 Python 或 Node.js 后重试。
pause

:end
