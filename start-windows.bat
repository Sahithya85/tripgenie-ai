@echo off
cd /d "%~dp0"
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo A file named .env will open. Replace your-gemini-api-key-here with your real Gemini key, save, and close it.
  notepad ".env"
)
if not exist "node_modules" (
  call npm install
)
call npm start
pause
