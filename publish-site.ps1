<#
.SYNOPSIS
Publishes this complete catalogue to LeonBaker8/minigt-prototypes.

.DESCRIPTION
Run with no arguments to publish the current site. Pass an Excel workbook path to
extract fresh data and images first, then publish everything in one operation.
When potential models and Qube Carz are stored separately, pass them as the second and third paths.

.EXAMPLE
.\publish-site.ps1

.EXAMPLE
.\publish-site.ps1 "C:\Users\Leon\Downloads\Mini GT.xlsx" "C:\Users\Leon\Downloads\Mini GT Potential Models.xlsx"

.\publish-site.ps1 "C:\Users\Leon\Downloads\Mini GT.xlsx" "C:\Users\Leon\Downloads\Mini GT Potential Models.xlsx" "C:\Users\Leon\Downloads\Qube Carz.xlsx"
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateScript({ -not $_ -or (Test-Path -LiteralPath $_ -PathType Leaf) })]
    [string]$WorkbookPath,

    [Parameter(Position = 1)]
    [ValidateScript({ -not $_ -or (Test-Path -LiteralPath $_ -PathType Leaf) })]
    [string]$PotentialWorkbookPath,

    [Parameter(Position = 2)]
    [ValidateScript({ -not $_ -or (Test-Path -LiteralPath $_ -PathType Leaf) })]
    [string]$QubeCarzWorkbookPath,

    [string]$CommitMessage = "Update MINI GT prototypes"
)

$ErrorActionPreference = "Stop"
$gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
if ($gitCommand) {
    $gitPath = $gitCommand.Source
} else {
    $gitCandidates = @(
        (Join-Path $env:ProgramFiles "Git\cmd\git.exe"),
        (Join-Path ([Environment]::GetFolderPath("ProgramFilesX86")) "Git\cmd\git.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\Git\cmd\git.exe"),
        (Join-Path $env:USERPROFILE "scoop\apps\git\current\cmd\git.exe")
    )
    $gitPath = $gitCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
}
if (-not $gitPath) {
    throw "Git for Windows was not found. Install it from https://git-scm.com/download/win, then run update-site.cmd again."
}

$projectRoot = Split-Path -Parent $PSCommandPath
$repoUrl = "https://github.com/LeonBaker8/minigt-prototypes.git"

$origin = (& $gitPath -C $projectRoot remote get-url origin 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -ne $repoUrl) {
    throw "This folder is not connected to the expected GitHub repository. Nothing was published."
}

Write-Host "1/5 Getting the latest GitHub version..." -ForegroundColor Cyan
& $gitPath -C $projectRoot pull --ff-only origin main
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
    $extractArgs = @((Join-Path $projectRoot "scripts\extract_catalog.py"), $WorkbookPath)
    if ($PotentialWorkbookPath) {
        $extractArgs += $PotentialWorkbookPath
    }
    if ($QubeCarzWorkbookPath) {
        if (-not $PotentialWorkbookPath) {
            throw "Pass the Potential Models workbook as the second path before the Qube Carz workbook."
        }
        $extractArgs += $QubeCarzWorkbookPath
    }
    & $pythonPath @extractArgs
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
& $gitPath -C $projectRoot add --all
& $gitPath -C $projectRoot diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub already has this exact version." -ForegroundColor Yellow
    return
}
if ($LASTEXITCODE -ne 1) {
    throw "Git could not inspect the staged changes."
}

Write-Host "4/5 Creating the GitHub update..." -ForegroundColor Cyan
& $gitPath -C $projectRoot commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    throw "Git could not create the update commit."
}

Write-Host "5/5 Sending the update to GitHub..." -ForegroundColor Cyan
& $gitPath -C $projectRoot push origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git could not push the update. Complete any GitHub sign-in prompt, then run the script again."
}

Write-Host "Published successfully. Vercel will redeploy automatically." -ForegroundColor Green
