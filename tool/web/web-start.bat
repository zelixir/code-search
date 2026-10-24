@echo off
cd /d %~dp0..\..
bun tool\webserver.mjs --port 8642
