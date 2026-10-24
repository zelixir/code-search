@echo off
cd /d %~dp0..\..
:loop
bun tool\webserver.mjs --port 8642 >> tool\web\web.log 2>&1
echo [%date% %time%] webserver exited, restarting >> tool\web\web.log
timeout /t 3 /nobreak >nul
goto loop