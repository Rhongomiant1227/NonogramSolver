# Nonogram Studio

[简体中文](README.md)

Nonogram Studio is a local Nonogram / Picross solver with a responsive web interface, clue validation, unique/multiple-solution feedback, and animated cell rendering.

## Start

On Windows, double-click `start.bat`. The script creates the `.venv` virtual environment on first run and opens the browser automatically. You can also run `./run.ps1` from PowerShell. The default address is <http://localhost:8000>.

The application uses only Python's standard library, so no third-party runtime packages need to be downloaded. It accepts boards from 1×1 through 120×120. Row and column clues can be separated with spaces, English commas, Chinese commas, or Chinese enumeration commas. Multi-digit clues are supported directly, for example `10 2`.

## Languages

The interface defaults to Simplified Chinese and can be switched from the language menu. It includes English, Japanese, Korean, Spanish, French, German, Portuguese, Hindi, and Russian. The selected language is saved in the browser and restored on the next visit. The UI uses UTF-8 throughout to preserve non-ASCII clues and translations.

## Solver

The solver generates valid row and column arrangements, represents each arrangement as a bit mask, applies constraint propagation, and branches on the line with the fewest candidates. It reports a unique solution, multiple solutions, an unsatisfiable puzzle, or a guarded resource limit. Input validation catches malformed clues, impossible clue lengths, and mismatched filled-cell totals before solving.

This problem is a discrete constraint search. The implementation is optimized for CPU execution; GPU acceleration would generally add transfer overhead without improving candidate filtering for these board sizes. Keeping the runtime dependency-free also makes the Windows one-click launcher reliable.

## Tests

Run the solver tests from PowerShell:

```powershell
.\.venv\Scripts\python.exe -m unittest -v
```

The browser acceptance flow covers language switching, example solving, multiple-solution and invalid-input feedback, responsive layout at phone width, clearing the canvas, and copying the answer.

## Files

- `app.py` — standard-library HTTP server and solver API.
- `static/index.html` — responsive application shell.
- `static/app.js` — input handling, API calls, rendering, and animations.
- `static/i18n.js` — localized UI strings and language metadata.
- `start.bat` — one-click Windows launcher.
- `run.ps1` — PowerShell launcher.
