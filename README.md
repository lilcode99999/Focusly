# Smart Bookmarks Extension

Smart Bookmarks is a local-first Chrome extension for ADHD-friendly context recovery. The MVP helps you save why a page mattered, what to do next, and how to return to abandoned research or work without rebuilding context from scratch.

## Current MVP Path

- React + TypeScript popup and options UI under `src/`
- Chrome Extension Manifest V3
- Vite production output in `dist/`
- Local persistence through Chrome storage
- Backend, sync, billing, and AI services are intentionally parked behind adapter boundaries until the local-first workflow feels valuable

Legacy root-level JavaScript files are still present in the repository, but the React/Vite extension in `src/` is the documented load target.

## MVP Features

- Save the current page with title, URL, tags, note, why-saved context, mood, energy, and next action
- Search saved items by title, URL, tags, notes, why-saved text, mood, energy, and next action
- Return-to-context cards for unfinished next actions, current-domain matches, and saved-but-not-revisited pages
- Start focus sessions from bookmarks or context cards
- Persist focus sessions, completion summaries, and daily focus minutes locally

## Development

Install dependencies:

```bash
npm install
```

Build the extension:

```bash
npm run build
```

Load the extension:

1. Open Chrome and go to `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked
4. Select the generated `dist/` directory

After changing extension code, run `npm run build` again and reload the unpacked extension from `chrome://extensions/`.

## Notes

- Do not load the repository root for the React/Vite MVP.
- Do not commit `dist/`, `node_modules/`, local env files, or generated local databases.
- Cloud sync, billing, Supabase auth, and MCP AI routing can be revisited after the local-first workflow is stable.
