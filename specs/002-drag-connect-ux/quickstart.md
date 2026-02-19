# Quickstart: Intuitive Module Connection UX

**Feature**: 002-drag-connect-ux  
**Date**: 2026-02-19

This guide lets you exercise the feature manually end-to-end as soon as it is implemented, and confirms what "done" looks like for each user story.

---

## Prerequisites

```bash
cd /path/to/everest-admin-panel
pnpm install
pnpm dev
# Open http://localhost:5173 in a browser
```

The dev server auto-connects to the **simulator** (loopback RPC), so no backend is needed. Sample modules from `src/modules/evbc/simulator-sample-data/` are loaded automatically.

---

## Story 1 — Understand Terminal Types at a Glance

1. Open the app and navigate to the **Config** page.
2. Load or create any configuration that places two or more modules on the canvas (e.g. load `config-sil.yaml` from the simulator).
3. Observe the terminals without clicking:
   - Look at the edge of any module. Terminals with a **provide** role must show a plug icon whose prongs point outward from the module edge.
   - Terminals with a **requirement** role must show a socket icon.
4. ✅ Pass criterion: You can distinguish the two terminal types by icon alone, without reading any tooltip or documentation.

---

## Story 2 — Connect Modules by Clicking

### 2a. Entering selection mode

1. Click any **provide** terminal on a module.
2. Observe:
   - All other terminals on **the same module** grey out.
   - The clicked terminal icon enlarges (~50% bigger).
   - Every **requirement** terminal on other modules that has a matching interface and is not already connected to this terminal becomes **highlighted** (full brightness, enlarged).
   - Everything else on the canvas dims (modules with no compatible terminals, existing connection lines, etc.).
   - The left-panel module list updates to show only modules that have at least one compatible target terminal.

### 2b. Creating a connection by clicking a terminal

1. While selection mode is active, click one of the highlighted requirement terminals on another module.
2. Observe:
   - A connection line appears between the two modules.
   - The provide terminal shows a **filled circle** icon at normal scale.
   - The requirement terminal shows a **filled arrowhead** icon pointing toward its module at normal scale.
   - The canvas returns to idle state (no dimming).

### 2c. Creating a connection via the left panel

1. Click a provide terminal to enter selection mode.
2. Click a module name in the left panel (must have a compatible unconnected terminal).
3. Observe same outcome as 2b.

### 2d. Cancelling the selection

1. Click a provide terminal to enter selection mode.
2. Click on an empty area of the canvas background.
3. Observe: All dimming and enlargement clears; no connection was created.

### 2e. Connecting from a requirement terminal (symmetric)

Repeat 2a–2d starting from a **requirement** terminal. The roles reverse: compatible **provide** terminals are highlighted, compatible modules shown in the left panel.

### 2f. Multi-connection (one-to-many)

1. Connect terminal A (provide) on Module 1 to terminal B (requirement) on Module 2.
2. Click terminal A again.
3. Observe: The connection line to Module 2 and terminal B dim (indicating an existing connection). Compatible terminals on **other** modules that are not yet connected to terminal A are highlighted.
4. Click a compatible terminal on Module 3.
5. Observe: A second connection line appears; terminal A's filled-circle icon is still shown; both lines are visible in idle state.

---

## Story 3 — Connect Modules by Dragging

### 3a. Drag to a specific terminal

1. Hover over a provide terminal until cursor changes.
2. Click and hold, then drag. Observe:
   - The terminal icon "detaches" and follows the cursor at 1.5× scale.
   - A **dashed line** runs from the terminal's fixed original position on the module to the cursor.
   - The ghost icon rotates to face away from the origin along the dashed line.
   - Same canvas dimming as in Story 2 is applied immediately on drag start.
3. Drag to a highlighted compatible requirement terminal on another module and release.
4. Observe: Connection created; ghost icon disappears; both terminals show connected icons at normal scale.

### 3b. Drag and drop on module body

1. Begin dragging a provide terminal.
2. Release the ghost over the body of a compatible module (not precisely over its terminal).
3. Observe: Connection is made to the nearest compatible terminal of that module.

### 3c. Drag cancel

1. Begin dragging a provide terminal.
2. Release the ghost over an empty canvas area (or move mouse off the canvas and release).
3. Observe: Ghost icon snaps back to the terminal's original position; dashed line disappears; canvas returns to idle; no connection created.

---

## Story 4 — Verify Connected Icon States on Load

1. Save a configuration with at least two connected modules.
2. Reload the page (or close and re-open the config).
3. Observe, without performing any interaction:
   - Every connected **provide** terminal shows a **filled circle** icon.
   - Every connected **requirement** terminal shows a **filled arrowhead** pointing toward its module.
   - Unconnected terminals show plug or socket icons.

---

## Running Tests

```bash
# Unit tests (Vitest)
pnpm test

# E2E tests — headless
pnpm run test:e2e

# E2E tests — interactive (watch the browser)
pnpm run test:e2e:open
# Navigate to: cypress/e2e/drag-connect-ux.cy.ts
```

Key test file: `cypress/e2e/drag-connect-ux.cy.ts`  
Key unit test file: `src/modules/evconf_konva/views/shapes/terminal.test.ts`  
(and `terminal-visual-state.test.ts` once created)

---

## What a Broken Implementation Looks Like

| Symptom | Likely cause |
|---------|-------------|
| All terminals grey out including compatible ones after clicking | `ModuleViewModel._handle_stage_context_event` not checking compatibility correctly |
| Ghost icon doesn't rotate during drag | `ghostShape.rotation()` not being updated in mousemove handler |
| Dashed line stays after drop | `DragPreviewOverlay.destroy()` not called on dragend |
| Connected icon not shown after connection created | `terminal.set_visual_state()` not called after `ADD_CONNECTION` event |
| Left panel doesn't update during selection | `LeftPanelTerminalFilter` ref not wired into `EvModuleList.vue` |
| Dropping on module body always connects to wrong terminal | Euclidean distance calculation not using absolute positions |
