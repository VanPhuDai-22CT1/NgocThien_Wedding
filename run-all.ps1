$repo = "C:\NgocThien_Wedding"

Write-Host "Freeing ports 3000 and 4000 (if in use)..."
# try to kill ports if kill-port is available
try {
  npx kill-port 3000 4000 2>$null
} catch {
  Write-Host "kill-port may not be available; continuing..."
}

Start-Process -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd '$repo\\backend'; npm run dev" -WorkingDirectory "$repo\\backend"
Start-Process -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd '$repo'; npm run start:user" -WorkingDirectory "$repo"

Write-Host "Started backend and frontend in new PowerShell windows."
