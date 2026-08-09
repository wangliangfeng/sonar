@echo off
setlocal
set "SONAR_DIR=D:\Claude Code\sonar"
set "LOG=%SONAR_DIR%\dev.log"
set "NODE=C:\nvm4w\nodejs\node.exe"

REM 3000 already serving -> skip (idempotent, avoids duplicate instances)
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 exit /b 0

REM ensure MySQL 5.7 on 3306
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
  if exist "D:\phpstudy_pro\Extensions\MySQL5.7.26\bin\mysqld.exe" (
    start /min "" "D:\phpstudy_pro\Extensions\MySQL5.7.26\bin\mysqld.exe" --defaults-file="D:\phpstudy_pro\Extensions\MySQL5.7.26\my.ini"
  )
)

REM start frp tunnel if configured
if exist "%SONAR_DIR%\frp\frpc.exe" (
  netstat -ano | findstr ":7500" | findstr "LISTENING" >nul 2>&1
  if errorlevel 1 (
    start /min "" "%SONAR_DIR%\frp\frpc.exe" -c "%SONAR_DIR%\frp\frpc.toml"
  )
)

cd /d "%SONAR_DIR%"
start "sonar-dev" /min "%SONAR_DIR%\dev-server.bat"
exit /b 0
