@echo off
setlocal
powershell.exe -NoProfile -Command "try { Invoke-RestMethod -Uri 'http://127.0.0.1:4310/api/shutdown' -Method Post -Headers @{'X-Atelier-Request'='local'} -TimeoutSec 5 | Out-Null; Write-Host 'Atelier est arrete.' } catch { Write-Host 'Atelier ne repond pas sur le port 4310.' }"
