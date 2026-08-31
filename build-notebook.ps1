<#
.SYNOPSIS
  Builds a Jupyter notebook post for Jekyll: converts to clean HTML, fixes
  invalid fields, and moves to _includes/notebooks (for a plain
  {% include %}-embedded post, e.g. the connections-dashboard notebook). If
  a "<notebook>_dark.ipynb" sibling exists next to the main notebook, builds
  and moves that too -- the light/dark notebook-embed convention used by
  _posts/2026-08-29-build-gom-rig-tracker.md (see also DESIGN.md and
  _includes/head.html's .jupyter-container.theme-light/theme-dark rules).
  The dark notebook is otherwise a plain hand-maintained copy of the light
  one (its style-setup cell also layers matplotlib's dark_background style);
  this script does not generate it, only builds whichever of the two exist.

  Also writes a second copy of each built HTML file to assets/notebooks/,
  with the leading "{% raw %}"/trailing "{% endraw %}" lines stripped, for
  posts that lazy-load the matching-theme notebook at runtime instead of
  baking both into the page (see _includes/header.html's
  loadJupyterNotebook()) -- embedding both light and dark notebook renders
  via {% include %} on the same page doubles the HTML payload and silently
  renders a second, invisible copy of any live Plotly output inside them.
  The raw/endraw wrapper is only needed to protect Jekyll's Liquid engine
  when the file is {% include %}-d into a templated page; a fetch()-and-
  inject doesn't go through Liquid at all, so the literal "{% raw %}" text
  would otherwise show up as stray content once injected.

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
$Notebook = "2026-08-29-bsee-map-jupyter.ipynb"
$HtmlOutput = "2026-08-29-bsee-map-jupyter.html"  # nbconvert outputs this name
$DarkNotebook = $Notebook -replace '\.ipynb$', '_dark.ipynb'
$DarkHtmlOutput = $HtmlOutput -replace '\.html$', '_dark.html'
$FixScript = "fix_nb.py"   # your existing fix script
$IncludesDir = "_includes\notebooks"
$AssetsNotebooksDir = "assets\notebooks"

# Converts one notebook to HTML and moves it into _includes/notebooks.
# $Required = $true (the light notebook) hard-fails like the script always
# has if anything goes wrong. $Required = $false (the dark notebook) skips
# quietly when the file simply doesn't exist yet -- most posts have no dark
# variant -- but still hard-fails if it exists and the build breaks.
function Build-NotebookHtml {
    param(
        [string]$NotebookFile,
        [string]$HtmlFile,
        [bool]$Required
    )

    if (-Not (Test-Path "$SrcFolder\$NotebookFile")) {
        if ($Required) {
            Write-Error "Notebook not found: $SrcFolder\$NotebookFile"
            exit 1
        }
        Write-Host "Skipping $NotebookFile (no dark variant for this post)" -ForegroundColor DarkGray
        return
    }

    Write-Host "Running fix_nb.py on $NotebookFile..." -ForegroundColor Cyan
    Push-Location $SrcFolder
    & "C:\venvs\MPD_Blog\Scripts\python.exe" "..\$FixScript" $NotebookFile

    if ($LASTEXITCODE -ne 0) {
        Write-Error "fix_nb.py failed on $NotebookFile"
        Pop-Location
        exit 1
    }

    Write-Host "Converting $NotebookFile to HTML..." -ForegroundColor Cyan
    jupyter nbconvert $NotebookFile `
        --to html `
        --template basic `
        --no-prompt `
        --HTMLExporter.exclude_anchor_links=True `
        --TagRemovePreprocessor.enabled=True `
        --TagRemovePreprocessor.remove_cell_tags remove_cell

    if ($LASTEXITCODE -ne 0) {
        Write-Error "nbconvert failed on $NotebookFile"
        Pop-Location
        exit 1
    }

    Pop-Location

    if (-Not (Test-Path $IncludesDir)) {
        New-Item -ItemType Directory -Path $IncludesDir | Out-Null
        Write-Host "Created directory $IncludesDir" -ForegroundColor Green
    }

    $SourceHtml = "$SrcFolder\$HtmlFile"
    $DestinationHtml = "$IncludesDir\$HtmlFile"

    if (-Not (Test-Path $SourceHtml)) {
        Write-Error "HTML file not found: $SourceHtml"
        exit 1
    }

    Move-Item -Force $SourceHtml $DestinationHtml
    Write-Host "Moved HTML to $DestinationHtml" -ForegroundColor Green

    if (-Not (Test-Path $AssetsNotebooksDir)) {
        New-Item -ItemType Directory -Path $AssetsNotebooksDir | Out-Null
    }
    # Whole-file string replace rather than line-array index tricks: the
    # raw cell's own line (e.g. "{% raw %}") sits on its own line, but
    # nbconvert runs adjacent cells' HTML onto the same line with no
    # separating newline (e.g. "</div>{% endraw %}"), and Get-Content's
    # per-line array can carry trailing empty elements after the real last
    # line -- both make index-based ($lines[0]/$lines[-1]) stripping
    # fragile. Each marker is known to appear exactly once (the notebook's
    # single {% raw %}/{% endraw %} raw-cell pair), so a literal replace
    # across the full text is simpler and robust regardless of exact
    # line/whitespace boundaries.
    $content = Get-Content -LiteralPath $DestinationHtml -Raw
    $content = $content.Replace('{% raw %}', '').Replace('{% endraw %}', '')
    $FetchableHtml = "$AssetsNotebooksDir\$HtmlFile"
    Set-Content -LiteralPath $FetchableHtml -Value $content -NoNewline -Encoding utf8
    Write-Host "Wrote fetchable copy to $FetchableHtml (raw/endraw stripped)" -ForegroundColor Green
}

Build-NotebookHtml -NotebookFile $Notebook -HtmlFile $HtmlOutput -Required $true
Build-NotebookHtml -NotebookFile $DarkNotebook -HtmlFile $DarkHtmlOutput -Required $false

Write-Host "`nBuild complete!" -ForegroundColor Yellow
Write-Host "Plain embed:  {% include notebooks/$HtmlOutput %}" -ForegroundColor White
if (Test-Path "$IncludesDir\$DarkHtmlOutput") {
    Write-Host "              {% include notebooks/$DarkHtmlOutput %}  (dark-theme variant)" -ForegroundColor White
    Write-Host "Lazy-load:    data-src pointing at /assets/notebooks/$HtmlOutput and _dark.html -- see loadJupyterNotebook() in _includes/header.html" -ForegroundColor White
}
