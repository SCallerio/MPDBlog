<#
.SYNOPSIS
  Builds a Jupyter notebook post for Jekyll: converts to clean HTML, fixes invalid fields, and moves to _includes/notebooks

.USAGE
  .\build-notebook.ps1 2025-12-23-bsee-map-jupyter-example

.PARAMETER Slug
  The folder/slug name (e.g. 2025-12-23-bsee-map-jupyter-example)
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Slug
)

# Automatically activate venv if it exists
$venvPath = "C:\venvs\MPD_Blog\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & $venvPath
} else {
    Write-Warning "Virtual environment not found at $venvPath. Skipping activation."
}
# Configuration — adjust if your structure is different
$SrcFolder = "src\$Slug"
$Notebook = "2025-12-23-bsee-map-jupyter.ipynb"
$HtmlOutput = "2025-12-23-bsee-map-jupyter.html"  # nbconvert outputs this name
$FixScript = "fix_nb.py"   # your existing fix script
$IncludesDir = "_includes\notebooks"
$FinalHtml = "$IncludesDir\$Slug.html"

# Step 2: Run the fix script on the notebook (helps with validation errors)
Write-Host "Running fix_nb.py..." -ForegroundColor Cyan
Push-Location $SrcFolder
& "C:\venvs\MPD_Blog\Scripts\python.exe" "..\$FixScript" $Notebook

if ($LASTEXITCODE -ne 0) {
    Write-Error "fix_nb.py failed"
    Pop-Location
    exit 1
}

Pop-Location

# Step 1: Go to the source folder and run nbconvert
Write-Host "Converting $Notebook to HTML..." -ForegroundColor Cyan
Push-Location $SrcFolder

jupyter nbconvert $Notebook `
    --to html `
    --template basic `
    --no-prompt `
    --TagRemovePreprocessor.enabled=True `
    --TagRemovePreprocessor.remove_cell_tags remove_cell

if ($LASTEXITCODE -ne 0) {
    Write-Error "nbconvert failed"
    Pop-Location
    exit 1
}


# Step 3: Ensure _includes/notebooks exists
if (-Not (Test-Path $IncludesDir)) {
    New-Item -ItemType Directory -Path $IncludesDir | Out-Null
    Write-Host "Created directory $IncludesDir" -ForegroundColor Green
}

# Step 4: Move and rename the HTML file
$SourceHtml = "$SrcFolder\$HtmlOutput"
$DestinationHtml = "$FinalHtml"

if (-Not (Test-Path $SourceHtml)) {
    Write-Error "HTML file not found: $SourceHtml"
    exit 1
}

Move-Item -Force $SourceHtml $DestinationHtml
Write-Host "Moved HTML to $DestinationHtml" -ForegroundColor Green

Write-Host "`nBuild complete! Include in your post with:" -ForegroundColor Yellow
Write-Host "{% include notebooks/$Slug.html %}" -ForegroundColor White
