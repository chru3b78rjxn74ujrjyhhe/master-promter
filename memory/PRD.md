# Master Prompter — PRD

## Original Problem Statement
Build a Master Prompter web app: user types a rough idea → selects a target AI → selects a prompt style → clicks Generate. App calls Anthropic Claude API (`claude-4-sonnet-20250514`) and returns an engineered prompt, 3 pro tips, and 2 variations. Includes copy-to-clipboard for the main prompt and each variation. Luxury dark editorial design (deep black, rich purple, soft violet, muted gold, off-white; Playfair Display headings, DM Mono prompt boxes, Inter body; max-width 820px, Roman-numeral section labels).

## Target AIs
ChatGPT, Midjourney, DALL·E 3, Sora, Stable Diffusion, Gemini, Claude, GitHub Copilot

## Prompt Styles
Detailed & Technical, Creative & Expressive, Concise & Direct, Step-by-Step, Storytelling

## Architecture
- **Backend**: FastAPI + Motor (MongoDB) + emergentintegrations (Claude Sonnet 4 via EMERGENT_LLM_KEY)
- **Frontend**: React 19 + Tailwind + shadcn/ui (Select, Sheet) + sonner (toasts) + lucide-react
- **Storage**: MongoDB collections `history` and `favorites`

## API Endpoints
- `GET  /api/`                       — health
- `POST /api/generate`              — generate engineered prompt (saves to history)
- `GET  /api/history`               — list history (desc by created_at)
- `DELETE /api/history/{id}`        — delete single history entry
- `DELETE /api/history`             — clear all history
- `GET  /api/favorites`             — list favorites
- `POST /api/favorites`             — save a favorite
- `DELETE /api/favorites/{id}`      — remove favorite

## User Personas
- **Creative studio professional** crafting image / video / copy prompts for multiple AI tools
- **Developer** generating GitHub Copilot / Claude prompts
- **Prompt-craft hobbyist** collecting and remixing favorite prompts

## Core Requirements (static)
1. Rough-idea input
2. Target AI selector (8 options)
3. Prompt style selector (5 options)
4. Claude-generated engineered prompt + 3 tips + 2 variations
5. Copy-to-clipboard (toast + button text change)
6. Save favorites (MongoDB)
7. Prompt history (MongoDB)
8. Export to JSON file
9. Luxury dark editorial UI (820px, Playfair / DM Mono / Inter, gold Roman numerals)

## Implemented (2026-02)
- Backend with LLM integration, structured JSON parsing, Mongo persistence
- Luxury single-page UI with glass card, purple radial glow, dot-grid overlay
- Sections I–VI with gold Roman numerals and rule dividers
- Generate flow with animated border result box (DM Mono)
- 3 tips displayed with Roman-numeral numbering in gold
- 2 variations each with its own result box and copy button
- Copy-to-clipboard with sonner toast + button text change
- Favorites and History side-sheets with load / delete / clear
- Export current prompt as JSON
- 100% green backend tests (11/11 iteration_1.json)

## Implemented — Feature pass 2 (2026-02)
- **Prompt rating**: thumbs up / thumbs down on every generated prompt; persisted on the history record via `PATCH /api/history/{id}/rating`; toggle-off supported
- **Share via link**: public read-only `/share/:id` route backed by `GET /api/shared/{id}` (looks up in history or favorites); "Share" button copies the link
- **Custom AI tool**: "+ Custom" toggle reveals an inline input; custom targets persist in localStorage and appear in the Target AI select under a gold divider, with "Remove custom" action when selected
- **Dark/Light theme toggle**: luxury parchment/daylight light mode preserving purple+gold accents, toggle in header persisted in localStorage, sonner toaster adapts to theme

## Backlog
- **P1**: Tag / rename favorites
- **P2**: Regenerate variations only (without regenerating main prompt)
- **P2**: Keyboard shortcut ⌘↵ to generate
- **P2**: Public prompt marketplace (gallery of opted-in favorites)
- **P3**: Per-target-AI prompt templates / presets

## Next Tasks
- Gather user feedback on the first flow
- Prioritise P1 items for next iteration
