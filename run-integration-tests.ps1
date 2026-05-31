# Ensure the script runs from the repository root
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)

# Start PostgreSQL with Docker
Write-Host "Starting PostgreSQL with Docker..." -ForegroundColor Green
docker-compose up -d

# Wait for database to be ready by using pg_isready inside the container
Write-Host "Waiting for PostgreSQL container to be ready..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
while ($attempt -lt $maxAttempts) {
    # Use docker exec to call pg_isready inside the postgres container
    docker exec tiendademo-db pg_isready -U postgres > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is ready inside container 'tiendademo-db'!" -ForegroundColor Green
        break
    }

    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts - Waiting for PostgreSQL..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "PostgreSQL failed to start after $maxAttempts attempts" -ForegroundColor Red
    # Show container logs for debugging
    Write-Host "---- Container logs (last 200 lines) ----" -ForegroundColor Yellow
    docker logs --tail 200 tiendademo-db
    exit 1
}

# Run integration tests
Write-Host "Running integration tests..." -ForegroundColor Green
# Ensure Node allows dynamic imports used by test utils
$env:NODE_OPTIONS = "--experimental-vm-modules"
# Set Node env for medusa to 'test' and ensure dotenv for medusa integration is loaded
$env:NODE_ENV = "test"
$env:DOTENV_CONFIG_PATH = (Resolve-Path "medusa-app\tiendademo-medusa\.env.test").Path

# Run the medusa-app integration tests from its package context
npm --prefix medusa-app/tiendademo-medusa run test:integration:http

# Capture exit code
$exitCode = $LASTEXITCODE

# Stop Docker
Write-Host "Stopping PostgreSQL..." -ForegroundColor Yellow
docker-compose down

exit $exitCode
