Write-Host "Starting KidsPlay at http://localhost:8080 ..." -ForegroundColor Green
try {
    # Try python first
    if (Get-Command python -ErrorAction SilentlyContinue) {
        python -m http.server 8080
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        py -m http.server 8080
    } else {
        Write-Host "Python not found, trying npx serve..." -ForegroundColor Yellow
        npx serve .
    }
} catch { Write-Error $_ }
