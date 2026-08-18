<#
.SYNOPSIS
    Build the site image and export it as a tarball, ready to copy to the VM.

.DESCRIPTION
    Builds locally rather than on the server: the VM has ~3.8 GB of RAM and
    `next build` wants around 2 GB of it, and a build that fails here never
    reaches production at all.

    Stops at the tarball. Transferring and loading it is done by hand - the
    commands are printed at the end.

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
    [string] $SiteUrl = 'http://4.194.62.222',
    [switch] $SkipTests
)

$ErrorActionPreference = 'Stop'

$image = 'smartalliance-web:latest'
$root  = Split-Path $PSScriptRoot -Parent
$tar   = Join-Path $root 'smartalliance-web.tar'

Push-Location $root
try {
    if (-not $SkipTests) {
        Write-Host "`n== Tests ==" -ForegroundColor Cyan
        npm test
        if ($LASTEXITCODE -ne 0) { throw 'Tests failed - nothing was built.' }
    }

    Write-Host "`n== Build ($SiteUrl) ==" -ForegroundColor Cyan
    docker build --build-arg "NEXT_PUBLIC_SITE_URL=$SiteUrl" -t $image .
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }

    # Tagged :latest before saving, deliberately. Save a :test tag instead and
    # the tarball carries that name, compose keeps pointing at :latest, and the
    # deploy quietly does nothing.
    Write-Host "`n== Export ==" -ForegroundColor Cyan
    docker save -o $tar $image
    if ($LASTEXITCODE -ne 0) { throw 'docker save failed.' }

    $mb = [math]::Round((Get-Item $tar).Length / 1MB)
    Write-Host "  $tar ($mb MB)"

    # ~102 MB, over GitHub's 100 MiB per-file limit. `.gitignore` carries a
    # `*.tar` rule so this cannot be committed by accident again.
    Write-Host "`nBuilt. Copy it up and load it:" -ForegroundColor Green
    Write-Host "  scp .\smartalliance-web.tar azureuser@4.194.62.222:/tmp/"
    Write-Host "  ssh azureuser@4.194.62.222"
    Write-Host "  docker tag $image smartalliance-web:previous 2>/dev/null || true"
    Write-Host "  docker load -i /tmp/smartalliance-web.tar && rm /tmp/smartalliance-web.tar"
    Write-Host "  cd /var/www/company-web && docker compose up -d && docker image prune -f"
    Write-Host "  docker compose ps"
}
finally {
    Pop-Location
}
