<#
.SYNOPSIS
Compatibility shortcut for the unified publisher.
#>

[CmdletBinding()]
param()

& (Join-Path $PSScriptRoot "publish-site.ps1")
