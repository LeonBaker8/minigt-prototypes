<#
.SYNOPSIS
Publishes this complete catalogue to LeonBaker8/minigt-prototypes.

.DESCRIPTION
Run with no arguments to publish the current site. Pass an Excel workbook path to
extract fresh data and images first, then publish everything in one operation.

.EXAMPLE
.\publish-site.ps1

.EXAMPLE
.\publish-site.ps1 "C:\Users\Leon\Downloads\Mini GT.xlsx"
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateScript({ -not $_ -or (Test-Path -LiteralPath $_ -PathType Leaf) })]
    [string]$WorkbookPath,

    [string]$CommitMessage = "Update MINI GT prototypes"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSCommandPath
$workspaceRoot = Split-Path -Parent $projectRoot
$repoUrl = "https://github.com/LeonBaker8/minigt-prototypes.git"
$publishFolder = Join-Path $workspaceRoot "minigt-prototypes-publish"

if ($WorkbookPath) {
    Write-Host "1/6 Extracting data and photos from Excel..." -ForegroundColor Cyan
    $pythonPath = (Get-Command python -ErrorAction Stop).Source
    & $pythonPath -c "import openpyxl" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing the Excel reader for the first run..." -ForegroundColor Cyan
        & $pythonPath -m pip install --user openpyxl
        if ($LASTEXITCODE -ne 0) {
            throw "Python could not install the Excel reader. Run 'python -m pip install --user openpyxl', then try again."
        }
    }
    & $pythonPath (Join-Path $projectRoot "scripts\extract_catalog.py") $WorkbookPath
    if ($LASTEXITCODE -ne 0) {
        throw "The Excel export failed. Nothing was sent to GitHub."
    }
} else {
    Write-Host "1/6 Using the current catalogue files..." -ForegroundColor Cyan
}

if (-not (Test-Path -LiteralPath $publishFolder)) {
    Write-Host "2/6 Cloning the GitHub repository..." -ForegroundColor Cyan
    & git clone $repoUrl $publishFolder
    if ($LASTEXITCODE -ne 0) {
        throw "Git could not clone the repository. Check your internet connection and GitHub sign-in, then run the script again."
    }
} else {
    Write-Host "2/6 Using the existing verified clone..." -ForegroundColor Cyan
}

$origin = (& git -C $publishFolder remote get-url origin 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -ne $repoUrl) {
    throw "The publish folder is not connected to the expected GitHub repository. Nothing was published."
}

Write-Host "3/6 Getting the latest GitHub version..." -ForegroundColor Cyan
& git -C $publishFolder pull --ff-only origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git could not update the local clone safely. Resolve the Git message, then run the script again."
}

Write-Host "4/6 Copying the complete site and image assets..." -ForegroundColor Cyan
Copy-Item (Join-Path $projectRoot "*") $publishFolder -Recurse -Force

$modelData = Join-Path $publishFolder "assets\data\models.json"
$imageFolder = Join-Path $publishFolder "assets\images"
$imageCount = (Get-ChildItem -LiteralPath $imageFolder -File -ErrorAction SilentlyContinue | Measure-Object).Count
if (-not (Test-Path -LiteralPath $modelData) -or $imageCount -lt 1) {
    throw "The required data or images are missing. Nothing was sent to GitHub."
}

Write-Host "5/6 Creating the GitHub update..." -ForegroundColor Cyan
& git -C $publishFolder add --all
& git -C $publishFolder diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub already has this exact version." -ForegroundColor Yellow
    return
}
if ($LASTEXITCODE -ne 1) {
    throw "Git could not inspect the staged changes."
}

& git -C $publishFolder commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    throw "Git could not create the update commit."
}

Write-Host "6/6 Sending the update to GitHub..." -ForegroundColor Cyan
& git -C $publishFolder push origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git could not push the update. Complete any GitHub sign-in prompt, then run the script again."
}

Write-Host "Published successfully. Vercel will redeploy automatically." -ForegroundColor Green
