# python
"""
Usage (PowerShell):
(.venv) PS> python fix_nb.py post.ipynb
"""

import sys
from pathlib import Path
import shutil
import nbformat

def fix_notebook(nb_path: Path) -> bool:
    nb = nbformat.read(str(nb_path), as_version=4)
    modified = False
    for cell in nb.cells:
        if cell.get('cell_type') == 'raw':
            if 'outputs' in cell:
                cell.pop('outputs', None)
                modified = True
            if 'execution_count' in cell:
                cell.pop('execution_count', None)
                modified = True
    if modified:
        backup = nb_path.with_suffix(nb_path.suffix + '.bak')
        shutil.copy2(str(nb_path), str(backup))
        nbformat.write(nb, str(nb_path))
        print(f"Fixed notebook and saved backup to `{backup}`")
    else:
        print("No invalid fields found in raw cells.")
    return modified

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Specify notebook path, e.g. `post.ipynb`")
        sys.exit(1)
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: `{path}`")
        sys.exit(1)
    fix_notebook(path)
