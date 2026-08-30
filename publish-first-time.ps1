<#!
.SYNOPSIS
Creates a verified clone of the GitHub repository and publishes the complete catalogue.

.DESCRIPTION
Use this once for the initial publication. Subsequent Excel updates use update-catalog.ps1.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSCommandPath
$workspaceRoot = Split-Path -Parent $projectRoot
$repoUrl = "https://github.com/LeonBaker8/minigt-prototypes.git"
$publishFolder = Join-Path $workspaceRoot "minigt-prototypes-publish"

if (Test-Path -LiteralPath $publishFolder) {
    throw "The folder '$publishFolder' already exists. Rename it or remove it before starting a fresh publish."
}

Write-Host "1/5 Cloning the GitHub repository..." -ForegroundColor Cyan
& git clone $repoUrl $publishFolder
if ($LASTEXITCODE -ne 0) {
    throw "Git could not clone the repository. Check your internet connection and GitHub sign-in, then try again."
}

$origin = (& git -C $publishFolder remote get-url origin 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -ne $repoUrl) {
    throw "The clone is not connected to the expected GitHub repository. Nothing was published."
}

Write-Host "2/5 Copying the complete catalogue and image assets..." -ForegroundColor Cyan
Copy-Item (Join-Path $projectRoot "*") $publishFolder -Recurse -Force

$modelData = Join-Path $publishFolder "assets\data\models.json"
$imageCount = (Get-ChildItem (Join-Path $publishFolder "assets\images") -File | Measure-Object).Count
if (-not (Test-Path -LiteralPath $modelData) -or $imageCount -lt 1) {
    throw "The assets check failed. Nothing was sent to GitHub."
}

Write-Host "3/5 Verifying Git changes..." -ForegroundColor Cyan
& git -C $publishFolder add --all
& git -C $publishFolder diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub already contains this exact catalogue." -ForegroundColor Yellow
    return
}
if ($LASTEXITCODE -ne 1) {
    throw "Git could not inspect staged changes."
}

Write-Host "4/5 Creating the catalogue commit..." -ForegroundColor Cyan
& git -C $publishFolder commit -m "Add complete MINI GT catalogue assets"
if ($LASTEXITCODE -ne 0) {
    throw "Git could not create the commit."
}

Write-Host "5/5 Pushing to GitHub..." -ForegroundColor Cyan
& git -C $publishFolder push origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git could not push the commit. Follow any GitHub sign-in prompt, then run the script again."
}

Write-Host "Published successfully. Vercel will redeploy automatically." -ForegroundColor Green
