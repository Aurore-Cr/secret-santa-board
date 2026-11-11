$ErrorActionPreference = 'Stop'
$project = Read-Host 'Chemin COMPLET du dossier secret-santa-board (contient backend et frontend)'
$project = $project.Trim('"')
if (!(Test-Path (Join-Path $project 'backend/package.json')) -or !(Test-Path (Join-Path $project 'frontend/package.json'))) { throw 'Projet introuvable : dossier backend/frontend attendu.' }
$source = $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $project "sauvegarde-photos-$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @(
 'backend/src/server.js',
 'backend/src/db.js',
 'frontend/src/api.js',
 'frontend/src/pages/MyWishes.jsx',
 'frontend/src/pages/Family.jsx',
 'frontend/index.html',
 'frontend/public/favicon.svg'
)
foreach ($relative in $files) {
 $target = Join-Path $project $relative
 $inputFile = Join-Path $source $relative
 if (!(Test-Path $inputFile)) { throw "Fichier du correctif manquant : $relative" }
 if (Test-Path $target) {
   $backupFile = Join-Path $backup $relative
   New-Item -ItemType Directory -Path (Split-Path $backupFile) -Force | Out-Null
   Copy-Item -LiteralPath $target -Destination $backupFile -Force
 }
}
Write-Host "Sauvegarde des fichiers effectuee : $backup"
foreach ($relative in $files) {
 $target = Join-Path $project $relative
 New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
 Copy-Item -LiteralPath (Join-Path $source $relative) -Destination $target -Force
}
Write-Host 'Correctifs installes. Aucune base SQLite ni .env modifie.'
Write-Host 'IMPORTANT : ne lancez PAS npm run init.'
Write-Host 'Backend : cd backend ; npm run dev'
Write-Host 'Frontend : cd frontend ; npm run dev'
Read-Host 'Appuyez sur Entree pour fermer'
