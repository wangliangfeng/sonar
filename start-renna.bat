@echo off
chcp 65001 >nul
title 人呐 服务器
cd /d "D:\Claude Code\sonar"

echo ============================================
echo   人呐 · REN NA 服务器启动器
echo ============================================
echo.

REM ---- 1. 确保 MySQL 5.7(3306) 在运行 ----
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
if errorlevel 1 (
  echo [MySQL] 3306 未监听，启动 phpStudy MySQL 5.7...
  powershell -NoProfile -Command "Start-Process -FilePath 'D:\phpstudy_pro\Extensions\MySQL5.7.26\bin\mysqld.exe' -ArgumentList '--defaults-file=D:\phpstudy_pro\Extensions\MySQL5.7.26\my.ini' -WindowStyle Hidden"
  set /a tries=0
  :waitmysql
  timeout /t 2 /nobreak >nul
  netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul 2>&1
  if errorlevel 1 (
    set /a tries+=1
    if %tries% lss 15 goto waitmysql
    echo [警告] MySQL 30 秒内未就绪！sonar 库功能将不可用。
    echo        请打开 phpStudy 检查 MySQL 5.7.26 是否正常。
  ) else (
    echo [MySQL] 5.7.26 已就绪 (3306)
  )
) else (
  echo [MySQL] 5.7 已在运行 (3306)
)

REM ---- 2. 释放 3000 端口残留 ----
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  taskkill /f /pid %%a >nul 2>&1
)

REM ---- 3. 启动 frpc 内网穿透（若已配置）----
if exist "D:\Claude Code\sonar\frp\frpc.exe" (
  netstat -ano | findstr /R /C:":7500 .*LISTENING" >nul 2>&1
  if errorlevel 1 (
    echo [frp] 启动内网穿透客户端...
    powershell -NoProfile -Command "Start-Process -FilePath 'D:\Claude Code\sonar\frp\frpc.exe' -ArgumentList '-c','D:\Claude Code\sonar\frp\frpc.toml' -WindowStyle Hidden"
  ) else (
    echo [frp] frpc 已在运行
  )
)

REM ---- 4. 启动 Next.js 服务器 ----
echo [启动] 服务器启动中，本窗口会显示运行日志...
echo [提示] 关闭本窗口 = 关闭服务器
echo.
"C:\nvm4w\nodejs\node.exe" "D:\Claude Code\sonar\node_modules\next\dist\bin\next" start -H 0.0.0.0 -p 3000

pause
