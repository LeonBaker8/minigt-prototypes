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
$repoUrl = "https://github.com/LeonBaker8/minigt-prototypes.git"

$origin = (& git -C $projectRoot remote get-url origin 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -ne $repoUrl) {
    throw "This folder is not connected to the expected GitHub repository. Nothing was published."
}

Write-Host "1/5 Getting the latest GitHub version..." -ForegroundColor Cyan
& git -C $projectRoot pull --ff-only origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git could not update the local clone safely. Resolve the Git message, then run the script again."
}

if ($WorkbookPath) {
    Write-Host "2/5 Extracting data and photos from Excel..." -ForegroundColor Cyan
    $pythonPath = (Get-Command python -ErrorAction Stop).Source
    & $pythonPath -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('openpyxl') else 1)"
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
    Write-Host "2/5 Using the current catalogue files..." -ForegroundColor Cyan
}

$modelData = Join-Path $projectRoot "assets\data\models.json"
$imageFolder = Join-Path $projectRoot "assets\images"
$imageCount = (Get-ChildItem -LiteralPath $imageFolder -File -ErrorAction SilentlyContinue | Measure-Object).Count
if (-not (Test-Path -LiteralPath $modelData) -or $imageCount -lt 1) {
    throw "The required data or images are missing. Nothing was sent to GitHub."
}

Write-Host "3/5 Checking the catalogue update..." -ForegroundColor Cyan
& git -C $projectRoot add --all
& git -C $projectRoot diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub already has this exact version." -ForegroundColor Yellow
    return
}
if ($LASTEXITCODE -ne 1) {
    throw "Git could not inspect the staged changes."
}

Write-Host "4/5 Creating the GitHub update..." -ForegroundColor Cyan
& git -C $projectRoot commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    throw "Git could not create the update commit."
}

Write-Host "5/5 Sending the update to GitHub..." -ForegroundColor Cyan
& git -C $projectRoot push origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git could not push the update. Complete any GitHub sign-in prompt, then run the script again."
}

Write-Host "Published successfully. Vercel will redeploy automatically." -ForegroundColor Green
