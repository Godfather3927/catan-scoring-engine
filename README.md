# Catan Scoring Engine

A dependency-free local microsite for tracking 3-6 player CATAN games with
custom expansion and scenario combinations.

## Open The App

Open `index.html` in a browser, or serve this directory locally for the most
consistent browser storage and download behavior:

```powershell
& 'C:\Users\wilee\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/index.html`.

## Included In This Build

- New-game setup with players, standard colors, thematic icon labels,
  expansions and all listed scenario selections.
- Custom combinations and optional scoring-category activation.
- Editable scoring values and configurable wonder-based or points-only
  victory paths.
- Overall scoring table and individual player verification scorecards.
- Confirmed title holders, Cities & Knights metropolis locking, Wonders of
  CATAN progress, and camel-aware contiguous route tracking.
- Suggestions for Longest Road, Largest Army, and Harbormaster based on
  recorded facts.
- Automatic Rivers of CATAN coin status: one unique Wealthiest Settler can
  receive the bonus, while any number of tied Poor Settlers receive the
  penalty.
- Old Boot victory-threshold modifier and automatic Poor Settler point penalty
  applied independently.
- Potential-winner alert and confirmed-but-editable completed state.
- Activity log, active-session undo/redo, multi-day play sessions, browser
  autosave, and timestamped JSON export/import.

## Data Notes

The most recent active game is stored in browser storage. Export JSON
checkpoints regularly for portable backup. Imported games preserve the
activity log and start with a fresh undo/redo history.
