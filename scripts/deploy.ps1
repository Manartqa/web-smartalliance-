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
    The https default assumes the VM's nginx already serves a certificate for
    the domain; otherwise every canonical link points at a page that won't load.

.PARAMETER SkipTests
    Skips `npm test`. There is no CI pipeline any more; use sparingly.

.EXAMPLE
    .\scripts\deploy.ps1

.EXAMPLE
    .\scripts\deploy.ps1 -SiteUrl http://4.194.62.222
#>
[CmdletBinding()]
param(
    [string] $SiteUrl = 'https://www.smartalliance.co.th',
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
    # The VM has no Compose and azureuser is not in the docker group - hence
    # plain `docker run` under sudo. DEPLOYMENT.md has the env check and rollback.
    Write-Host "`nBuilt. Copy it up and swap the container (env check, verify, rollback: DEPLOYMENT.md):" -ForegroundColor Green
    Write-Host "  scp .\smartalliance-web.tar azureuser@4.194.62.222:~/"
    Write-Host "  ssh azureuser@4.194.62.222"
    Write-Host "  sudo docker tag $image smartalliance-web:previous"
    Write-Host "  sudo docker load -i ~/smartalliance-web.tar && rm ~/smartalliance-web.tar"
    Write-Host "  sudo docker rm smartalliance-web-old 2>/dev/null || true"
    Write-Host "  sudo docker rename smartalliance-web smartalliance-web-old && sudo docker stop smartalliance-web-old"
    Write-Host "  sudo docker run -d --name smartalliance-web --restart unless-stopped -p 3000:3000 --env-file /home/azureuser/production.env $image"
    Write-Host "  sudo docker ps -a"
}
finally {
    Pop-Location
}
