@echo off
cd /d "%~dp0"
REM Electron exclusively owns the authenticated backend lifecycle.
npm run electron:dev
