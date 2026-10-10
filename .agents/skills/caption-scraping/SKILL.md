---
name: caption-scraping
description: >-
  Use this skill when working on the Google Meet caption scraping system.
  Covers MutationObserver patterns, DOM selector maintenance, speaker turn
  tracking/merging, transcript data flow, and handling Google Meet DOM changes.
---

# Google Meet Caption Scraping System

## How Caption Scraping Works

Google Meet renders closed captions in a `[role="region"][aria-label="Captions"]` container.
Each visible caption block (`.nMcdL`) contains:
- A speaker name element (`.NWpY1d`)
- A text element (`.ygicle`) that updates character-by-character as the person speaks
- An avatar image for fallback identification

### Lifecycle of a Caption Block
1. **Added to DOM** → `trackCaptionItem()` registers it in `activeTurns` Map
2. **Text updates** → `updateCaptionItem()` detects text changes via MutationObserver
3. **Removed from DOM** → `finalizeTurn()` locks the text and pushes to `finalizedTranscript`

## Speaker Turn Merge Logic

Same-speaker consecutive turns are merged to avoid fragmentation:

```
IF new turn speaker === previous turn speaker:
  IF texts are identical → skip (duplicate)
  IF new text starts with old text → replace (grew in place)
  ELSE → append with space separator
ELSE:
  Push as new entry
```

This merge runs in both `finalizeTurn()` and `saveTranscriptState()`.

## Updating Selectors When Meet Changes

When Google Meet updates its DOM:
1. Open a Meet call with captions ON.
2. Right-click a caption → Inspect Element.
3. Identify the new class names for:
   - The caption container (currently `.nMcdL`)
   - The speaker name (currently `.NWpY1d`)
   - The caption text (currently `.ygicle`)
4. Update the `SELECTORS` object at the top of `content.js`.
5. Test that the semantic fallbacks still work (role/aria-label, avatar detection).

## Data Flow

```
Meet DOM (CC blocks)
    │
    ▼ MutationObserver
content.js activeTurns (Map)
    │
    ▼ finalizeTurn()
content.js finalizedTranscript (Array)
    │
    ▼ saveTranscriptState()
chrome.storage.local.meetTranscript
    │
    ▼ pollTranscript() [1s interval]
popup.js → renders to Transcript tab
```

## Key Functions in content.js

| Function | Purpose |
|---|---|
| `getCaptionsRegion()` | Find the captions container with fallbacks |
| `isCaptionItem(node)` | Check if a DOM node is a caption block |
| `getCaptionItems(region)` | Get all caption blocks in the region |
| `getClosestCaptionItem(node)` | Walk up DOM to find parent caption block |
| `getSpeakerName(item)` | Extract speaker name from caption block |
| `getCaptionText(item)` | Extract caption text from caption block |
| `trackCaptionItem(el)` | Register new caption block in activeTurns |
| `updateCaptionItem(el)` | Update text for tracked caption block |
| `finalizeTurn(entry)` | Lock turn and push to finalizedTranscript |
| `saveTranscriptState()` | Merge active+finalized and save to storage |
| `startCapture()` | Setup MutationObserver + polling interval |
| `stopCapture()` | Disconnect observer, finalize all active turns |
