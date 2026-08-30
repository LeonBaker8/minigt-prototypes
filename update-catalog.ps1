<#!
.SYNOPSIS
Updates catalogue data and photos from an Excel workbook, then sends the changes to GitHub.

.EXAMPLE
.\update-catalog.ps1 "C:\Users\Leon\Downloads\Mini GT.xlsx"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$WorkbookPath,

    [string]$CommitMessage = "Update MINI GT catalogue"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSCommandPath
$python = Get-Command python -ErrorAction Stop

Write-Host "1/3 Extracting catalogue data and images..." -ForegroundColor Cyan
& $python.Source (Join-Path $projectRoot "scripts\extract_catalog.py") $WorkbookPath
if ($LASTEXITCODE -ne 0) {
    throw "The Excel export failed. No Git changes were sent."
}

$gitRoot = (& git -C $projectRoot rev-parse --show-toplevel 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or -not $gitRoot) {
    throw "This folder is not a Git repository. Run this script inside your cloned GitHub repository."
}
if ((Resolve-Path -LiteralPath $gitRoot).Path -ne (Resolve-Path -LiteralPath $projectRoot).Path) {
    throw "The Git repository root must be this project folder. Clone the repository first, then run the script there."
}

$origin = (& git -C $projectRoot remote get-url origin 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or -not $origin) {
    throw "No GitHub remote is configured. Add origin before running the updater."
}

Write-Host "2/3 Preparing the GitHub update..." -ForegroundColor Cyan
& git -C $projectRoot add --all
& git -C $projectRoot diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "There are no catalogue changes to publish." -ForegroundColor Yellow
    return
}
if ($LASTEXITCODE -ne 1) {
    throw "Git could not check staged changes."
}

& git -C $projectRoot commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    throw "Git could not create the update commit."
}

Write-Host "3/3 Sending the update to GitHub..." -ForegroundColor Cyan
& git -C $projectRoot push
if ($LASTEXITCODE -ne 0) {
    throw "Git could not push the update."
}

Write-Host "Done. Vercel will start a new deployment automatically." -ForegroundColor Green
