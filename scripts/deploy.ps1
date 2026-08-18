<#
.SYNOPSIS
    Build the site image locally and deploy it to the production VM.

.DESCRIPTION
    The VM has ~3.8 GB of RAM and `next build` wants around 2 GB of it, so the
    image is built here and shipped as a tarball rather than built there. That
    also means a broken build never reaches the server at all.

    Safe to re-run. The image currently on the VM is tagged `:previous` before
    the new one is loaded, so a rollback is one command - printed at the end.

.PARAMETER SiteUrl
    Baked into the JS bundle, sitemap.xml and the canonical tags AT BUILD TIME.
    Change it here - not in .env.production, where it does nothing at all.

.PARAMETER SkipTests
    Skips `npm test`. There is no CI pipeline any more; use sparingly.

.EXAMPLE
    .\scripts\deploy.ps1

.EXAMPLE
    .\scripts\deploy.ps1 -SiteUrl https://www.smartalliance.co.th
#>
[CmdletBinding()]
param(
    [string] $SiteUrl   = 'http://4.194.62.222',
    [string] $VmHost    = 'azureuser@4.194.62.222',
    [string] $RemoteDir = '/var/www/company-web',
    [switch] $SkipTests
)

$ErrorActionPreference = 'Stop'

$image = 'smartalliance-web:latest'
$tar   = Join-Path $env:TEMP 'smartalliance-web.tar'
$root  = Split-Path $PSScriptRoot -Parent

Push-Location $root
try {
    if (-not $SkipTests) {
        Write-Host "`n== Tests ==" -ForegroundColor Cyan
        npm test
        if ($LASTEXITCODE -ne 0) { throw 'Tests failed - nothing was deployed.' }
    }

    Write-Host "`n== Build ($SiteUrl) ==" -ForegroundColor Cyan
    docker build --build-arg "NEXT_PUBLIC_SITE_URL=$SiteUrl" -t $image .
    if ($LASTEXITCODE -ne 0) { throw 'Build failed - nothing was deployed.' }

    # Tagged :latest before saving, deliberately. Save a :test tag instead and
    # the tarball carries that name, compose keeps pointing at :latest, and the
    # deploy quietly does nothing.
    Write-Host "`n== Export ==" -ForegroundColor Cyan
    docker save -o $tar $image
    $mb = [math]::Round((Get-Item $tar).Length / 1MB)
    Write-Host "  $tar ($mb MB)"

    Write-Host "`n== Upload ==" -ForegroundColor Cyan
    scp $tar "${VmHost}:/tmp/smartalliance-web.tar"
    if ($LASTEXITCODE -ne 0) { throw 'Upload failed.' }

    Write-Host "`n== Deploy ==" -ForegroundColor Cyan
    # One SSH session, so one password prompt. The rollback tag is allowed to
    # fail: there is no previous image on the very first run.
    $remote = @"
set -e
docker tag $image smartalliance-web:previous 2>/dev/null || true
docker load -i /tmp/smartalliance-web.tar
rm -f /tmp/smartalliance-web.tar
cd $RemoteDir
docker compose up -d
docker image prune -f
sleep 20
docker compose ps
"@
    ssh $VmHost $remote
    if ($LASTEXITCODE -ne 0) { throw 'Remote deploy failed.' }

    Write-Host "`n== Verify ==" -ForegroundColor Cyan
    ssh $VmHost "curl -sS -o /dev/null -w 'nginx: %{http_code}\n' http://127.0.0.1/en"

    Write-Host "`nDeployed. Rollback if needed:" -ForegroundColor Green
    Write-Host "  ssh $VmHost 'cd $RemoteDir && docker compose down && docker tag smartalliance-web:previous $image && docker compose up -d'"
}
finally {
    Remove-Item $tar -ErrorAction SilentlyContinue
    Pop-Location
}
