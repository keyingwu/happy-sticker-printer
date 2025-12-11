# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server at http://localhost:3000
pnpm run build      # Production build
pnpm run preview    # Preview production build
```

Requires `GEMINI_API_KEY` environment variable in `.env.local`.

## Architecture Overview

This is an AI-powered sticker generator built with React 19, TypeScript, Vite, and Tailwind CSS. Users enter prompts, select a style, and the app generates sticker images via Google Gemini, which can be dragged onto a virtual "desk" canvas.

### Key Files

- **`src/App.tsx`** - Main container component. Manages all state (prompt, stickers, drag state, generation history) and renders the printer UI, canvas, and placed stickers.

- **`src/services/geminiService.ts`** - Gemini API integration with two-step generation:
  1. `generateConcept()` - Text model creates unique subject descriptions (tracks history to avoid repetition)
  2. Image generation with `gemini-2.5-flash-image` model
  3. `processImageWithTransparency()` - Canvas flood-fill algorithm removes black backgrounds for die-cut effect

- **`src/components/Printer.tsx`** - Skeuomorphic printer UI component that displays status, accepts form input, and shows fresh stickers with drag affordance.

- **`src/components/ui/`** - shadcn/ui components (button, input, select, card). Do not modify these default components.

### Data Flow

1. User enters prompt → selects style → clicks PRINT
2. `generateSticker()` creates concept text, then generates image
3. Image processed for transparency, displayed as "fresh sticker"
4. User drags sticker to canvas → becomes `PlacedSticker` in state
5. Stickers can be individually downloaded or batch-exported as ZIP

### Custom Patterns

- **Drag-and-drop**: Custom mouse/touch handlers with `getClientCoords()` normalization
- **Concept history**: Tracks generated concepts per prompt to prevent repetition
- **Generation count**: Cycles through aspect categories for variety
- **Image processing**: Canvas-based flood-fill for background removal to base64

### Styling

- Tailwind CSS with shadcn/ui components (New York style)
- Custom desk pattern defined in `index.html`
- Drop-shadow filters for sticker depth effect
- Custom `print-emerge` keyframe animation in Printer component
