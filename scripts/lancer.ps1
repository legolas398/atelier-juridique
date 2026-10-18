$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$runtimePath = Join-Path $projectDirectory '.runtime\node.exe'
if (-not (Test-Path -LiteralPath $runtimePath)) {
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw 'Node.js 24 ou plus récent est requis. Consultez README.md.' }
    $runtimePath = $nodeCommand.Source
}
if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'dist\index.html'))) {
    throw 'Compilation absente. Exécutez npm ci puis npm run build depuis ce dossier.'
}
$appOrigin = 'http://127.0.0.1:4310'
$alreadyRunning = $false
try {
    $health = Invoke-RestMethod -Uri "$appOrigin/api/health" -TimeoutSec 2
    $alreadyRunning = ($health.ok -and $health.name -eq 'Atelier juridique')
} catch { }
if (-not $alreadyRunning) {
    $logDirectory = Join-Path $projectDirectory 'data'
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
    $process = Start-Process -FilePath $runtimePath -ArgumentList @('server/index.mjs', '--production') -WorkingDirectory $projectDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'server.log') -RedirectStandardError (Join-Path $logDirectory 'server-error.log')
    $process.Id | Set-Content -LiteralPath (Join-Path $logDirectory 'server.pid')
    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 500
        if ($process.HasExited) { throw 'Le serveur a quitté. Consultez data\server-error.log.' }
        try { $health = Invoke-RestMethod -Uri "$appOrigin/api/health" -TimeoutSec 2; if ($health.ok -and $health.name -eq 'Atelier juridique') { $ready = $true; break } } catch { }
    }
    if (-not $ready) { throw 'Le serveur ne répond pas encore. Consultez les journaux dans data.' }
}
Write-Host "Atelier est prêt : $appOrigin"
Start-Process $appOrigin
