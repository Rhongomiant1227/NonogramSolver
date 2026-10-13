# Nonogram Studio

[简体中文](README.md)

Nonogram Studio is a local Nonogram / Picross solver with a responsive web interface, clue validation, unique/multiple-solution feedback, animated cell rendering, screenshot recognition, and optional mouse automation.

## Start

On Windows, double-click `start.bat`. The script creates the `.venv` virtual environment on first run and opens the browser automatically. You can also run `./run.ps1` from PowerShell. The default address is <http://localhost:8000>.

The application uses only Python's standard library, so no third-party runtime packages need to be downloaded. It accepts boards from 1×1 through 120×120. Row and column clues can be separated with spaces, English commas, Chinese commas, or Chinese enumeration commas. Multi-digit clues are supported directly, for example `10 2`.

## Screenshot recognition

Open “Screenshot recognition and automation”, choose a PNG or JPEG containing the full puzzle, clue areas, and board (cropping to the puzzle area avoids browser chrome and unrelated page content), then select “Recognize screenshot”. Grid and clue recognition run locally in the browser. The detected clues remain editable, and the app reports a confidence score before attempting to solve. Common white-background boards with dark borders, thick separators, and multi-digit clues such as 13 or 16 are supported. Check the clues manually when confidence is low or the site uses an unusual font.

After a successful solve, the app can generate left-click operations for filled cells and optional right-click operations for empty cells. Set X/Y offsets and scale for the current screen. The first click is always a dry-run unless both confirmation boxes are checked: confirm that the target page is visible and confirm that you reviewed the recognized clues and solution. The Windows API path is protected by these checks; non-Windows systems can still copy the generated script.

Coordinates are image pixels. If the screenshot starts at screen `(x, y)`, enter those values as offsets. If the current board has a different cell size, use `current cell size ÷ screenshot cell size` as the scale. Browser zoom, the address bar, and OS DPI scaling can affect the offset, so validate with a dry-run first.

## Languages

The interface defaults to Simplified Chinese and can be switched from the language menu. It includes English, Japanese, Korean, Spanish, French, German, Portuguese, Hindi, and Russian. The selected language is saved in the browser and restored on the next visit. The UI and HTTP responses use UTF-8 throughout.

## Solver and GPU

The solver generates valid row and column arrangements, applies constraint propagation, and branches on the line with the fewest candidates. This is a discrete constraint search optimized for CPU execution; GPU acceleration would generally add transfer overhead for these board sizes. Keeping the runtime dependency-free also makes the Windows one-click launcher reliable.

## Tests

```powershell
.\.venv\Scripts\python.exe -m unittest -v
```

The acceptance flow covers attachment upload, 25×25 grid detection, multi-digit clue recognition, automatic solving, language switching, phone-width layout, and mouse dry-run validation. An online Nonogram board was also used to verify the common left-click fill and right-click mark semantics; screen coordinates still need to be calibrated for the current page.

## Files

- `app.py` — standard-library HTTP server, solver API, and Windows mouse API.
- `static/index.html` — responsive application shell and animated styles.
- `static/app.js` — input handling, API calls, rendering, and screenshot workflow.
- `static/image.js` — browser-side grid detection, digit templates, and coordinate extraction.
- `static/i18n.js` — localized UI strings and language metadata.
- `start.bat` — one-click Windows launcher.
- `run.ps1` — PowerShell launcher.
