# Research: Intuitive Module Connection UX

**Feature**: 002-drag-connect-ux  
**Date**: 2026-02-19  
**Status**: Complete — all NEEDS CLARIFICATION items resolved

---

## 1. Icon Strategy for Terminal Roles

**Question**: What SVG path assets should represent the four terminal visual states (provide unconnected, requirement unconnected, provide connected, requirement connected), and how do they integrate with the existing `ICON_DATA` / Konva.Path rotation system?

**Research**: The existing `TerminalShape` extends `Konva.Path` and carries a single SVG path string (24×24 viewbox, centered at 12,12). The `set_alignment` method rotates the shape by 0°/90°/180°/270° based on terminal type × edge position. This means any icon we choose must be designed so that the "pointing away" direction corresponds to the **top** of the shape at 0° rotation (i.e., the tip of a plug points upward in the raw path, and the rotation system takes care of the rest).

**Decision**: Reuse the existing Konva.Path + rotation mechanism. Replace `ICON_DATA.TERMINAL` with four distinct path entries:

| Key | Visual | Raw orientation (0°) | Notes |
|-----|--------|----------------------|-------|
| `TERMINAL_PROVIDE` | Plug with prongs | Prongs point **up** | MDI `mdi-power-plug` path |
| `TERMINAL_REQUIREMENT` | Socket with holes | Opening points **up** | MDI `mdi-power-socket-eu` path (or simplified equivalent) |
| `TERMINAL_PROVIDE_CONNECTED` | Filled circle | Symmetrical, rotation irrelevant | Simple closed circle path |
| `TERMINAL_REQUIREMENT_CONNECTED` | Solid filled arrowhead | Arrowhead tip points **up** at 0° | Tip will point toward module after rotation (requirement+top = 180°, so tip flips down = toward module) |

The exact MDI SVG path strings are resolved during implementation; the key decisions (shape family and orientation convention) are fixed here.

**Alternatives considered**: Image/PNG assets (rejected: harder to theme, no smooth scaling); Konva shape primitives assembled in code (rejected: more complex to maintain than a single path string). MDI paths are already used elsewhere in the codebase (`ICON_DATA.EDIT`, `ICON_DATA.GRAB`).

---

## 2. Drag Ghost Approach

**Question**: How should the "detached icon that follows the cursor" be implemented in Konva.js without breaking the existing position tracking of the real terminal?

**Research**: Konva's native `draggable` flag moves the actual node. If we move the terminal shape itself, its absolute position (used by `get_terminal_placement` for connection line anchors) is temporarily wrong, causing connection line jitter. Approaches:
1. Move the real shape and restore position on dragend — introduces complexity and jitter.
2. Clone the terminal shape into a dedicated overlay layer, keep the original pinned — clean separation.
3. Use a separate `Konva.Path` (not a clone) positioned and styled ad hoc on dragstart — same cost as clone, slightly more code.

**Decision**: On terminal `dragstart`:
1. **Cancel Konva's native drag** on the terminal immediately (`e.target.stopDrag()`) so the original shape stays pinned at its position.
2. Create a **ghost `Konva.Path`** from scratch (same `data`, same fill, 1.5× scale) and add it to a dedicated **drag overlay layer** that sits above the static layer.
3. Drive the ghost's position via `stage.on("mousemove")` in the drag handler rather than Konva's drag system, to avoid coordinate-space mismatch.
4. On `mouseup` anywhere on the stage, evaluate the drop target, complete or cancel, then destroy the ghost.

This keeps the real terminal shape and its placement coordinates untouched throughout the drag.

**Alternatives considered**: Native Konva drag on terminal (rejected: position jitter for anchored connection lines); drag on the module group (rejected: user wants to drag just the terminal icon, not the whole module).

---

## 3. Dashed Preview Line

**Question**: How to draw a dashed line from fixed origin (terminal position) to cursor in Konva.js, updated in real time?

**Research**: `Konva.Line` supports a `dash` array property (e.g., `[8, 4]` = 8px dash, 4px gap). Points are updated via `line.points([x1, y1, x2, y2])` followed by `layer.batchDraw()`. The line lives on the drag overlay layer to ensure it renders above connection lines but below the ghost icon (Konva renders layer children in insertion order).

**Decision**: 
- Create a `Konva.Line` with `dash: [8, 4]`, `stroke: COLOR.CONNECTION`, `strokeWidth: 2`, `listening: false` on dragstart.
- Source point = terminal's absolute canvas position (computed once via `getAbsolutePosition()` of the terminal shape before the drag starts).
- End point = stage pointer position, translated to the overlay layer's local coordinate space, updated on every `mousemove`.
- Destroy the line on any drag end (success or cancellation).

No animation of the dash offset ("marching ants") — the static dashed line is sufficient for the interaction, and animating would require a separate `Konva.Animation` loop, which is unnecessary complexity.

---

## 4. Scale Animation for Highlighted Terminals

**Question**: How to smoothly scale terminal icons by 50% when entering/leaving selection state in Konva.js?

**Research**: `Konva.Tween` (or the `node.to({})` shorthand) animates any numeric Konva attribute. `TerminalShape` already sets `offset: { x: SIZE.TERMINAL/2, y: SIZE.TERMINAL/2 }`, which centres the scaling origin on the shape's visual centre. So `shape.to({ scaleX: 1.5, scaleY: 1.5, duration: 0.15 })` will scale from centre without displacement.

**Decision**: 
- On entering selection state (highlighted): `shape.to({ scaleX: 1.5, scaleY: 1.5, duration: 0.15 })`
- On leaving selection state (any reason): `shape.to({ scaleX: 1.0, scaleY: 1.0, duration: 0.15 })`
- Instant (no tween) for the clicked terminal itself on drag start — avoids visual confusion.

---

## 5. Dimming Strategy

**Question**: How to visually dim modules, connection lines, and terminal icons in a uniform, reversible way?

**Research**: Three options:
1. Change fill color to a disabled grey (current approach for `DISABLED` state) — per-shape, requires tracking previous color.
2. Set `opacity()` on shapes or groups — one call per group, GPU-composited, reversible with `.opacity(1)`.
3. Overlay a transparent grey rect on top — adds shapes to manage.

**Decision**: Apply `opacity()` at the appropriate level:
- **Dimmed terminal**: `terminalShape.opacity(0.25)`
- **Dimmed module (entire group)**: `moduleView.group.opacity(0.35)` — this automatically dims frame, title, and terminals together.
- **Dimmed connection line**: `connectionShape.opacity(0.25)`
- **Highlighted terminal**: full opacity (1.0) + scale (1.5×), everything else dimmed.

Reverting is a single `opacity(1.0)` call per affected object. This approach also means the existing `DISABLED` appearance state (which changes fill + disables hit testing for terminal repositioning mode) remains unchanged and conflict-free.

---

## 6. Multi-Connection Support in Stage Context

**Question**: The existing `clicked_terminal` in `stage_context.ts` assumes one active terminal slot (`_current_selected_terminal`). How does the new one-to-many connection model change this flow?

**Research**: Currently:
1. First click → store terminal, broadcast `SELECT TERMINAL`
2. Second click → broadcast `ADD_CONNECTION`, call `unselect()`

New behaviour (per spec clarification):
- A terminal may be connected to multiple targets.
- Clicking an already-connected terminal is valid and enters selection mode like any other terminal.
- When computing compatible targets, exclude only terminals **already connected to this specific originating terminal** (not all connected terminals).

**Decision**:
- `_current_selected_terminal` in `ConfigStageContext` now also carries `module_instance_id` (already stored as `_current_selected_terminal.module_instance_id`; no change needed to the stored type).
- After `ADD_CONNECTION`, do NOT call `unselect()`; instead re-broadcast `SELECT TERMINAL` for the same terminal to keep selection mode active. The user can then add more connections or click elsewhere to cancel. (This matches FR-011: "return the canvas to the idle state" — re-reading FR-011, it says return to idle. So after one connection, we DO exit. Correct: each click makes one connection and exits selection mode. Re-entering is done by clicking the terminal again.)
- `ConnectionManager.is_connected_pair(moduleA, terminalIdA, moduleB, terminalIdB): boolean` — used during target evaluation to exclude already-connected pairs from the compatible set.
- `ConnectionManager.get_connections_for_terminal(moduleView, terminalLookupId): ConnectionItem[]` — used to get existing connections for a terminal (needed to determine its connected icon state and to compute which targets are already connected to it).

---

## 7. Drop Target Detection

**Question**: When the ghost icon is released, how do we determine if the drop landed on a valid terminal or module, and which specific terminal to connect to when dropping over a module body?

**Research**: `Konva.Stage.getIntersection(pointerPos)` returns the top-most shape at the given absolute position. Terminal shapes have a `terminal_id` attribute and a `terminal_type` attribute accessible via `getAttr()`. Module frames (Konva.Rect) carry the module's group ID.

For "drop on module body" → find nearest compatible terminal:
- Get absolute positions of all highlighted (compatible) terminals on that module.
- Compute Euclidean distance from drop pointer to each terminal's absolute position.
- Connect to the closest one.

**Decision**:
- On dragend: call `stage.getIntersection(pointerPosition)`.
  - If result shape is a `TerminalShape` with correct `terminal_type` → connect directly.
  - If result shape is a module frame or title text → find nearest compatible terminal of that module view using distance from pointer.
  - Otherwise → cancel (no connection).
- Out-of-canvas mouseup (detected via `window.addEventListener("mouseup")` as a fallback to `stage.on("mouseup")`) → cancel drag.

---

## 8. Left Panel Integration

**Question**: The `EvModuleList.vue` left panel must filter to show only modules with compatible unconnected (to the originating terminal) terminals during selection mode. How does this integrate with the existing Vue / Pinia / ConfigStageContext architecture?

**Research**: `EvConfigCanvas.vue` already subscribes to `ConfigStageContext` events. The `Pinia` store (`useEvbcStore`) exposes the available module list. The selection state is broadcast via `ConfigStageContextEvent`. There is no current Vue-reactive signal for "terminal selected" state.

**Decision**: 
- Add a `ref<Terminal & { module_instance_id: ModuleInstanceID } | null>` signal to the `ConfigStageContext` (or expose it via a Vue `computed` in `EvConfigCanvas.vue`).
- Pass this as a prop to `EvModuleList.vue`: when non-null, `EvModuleList` renders only modules from the available list that have at least one terminal compatible with the selected terminal and not yet connected to it.
- The filtered list updates reactively whenever the terminal selection changes or is cleared.
- "Clicking a module in the left panel" during selection mode emits an event handled by `EvConfigCanvas.vue`, which calls `stage_context.clicked_left_panel_module(module_type)` → looks up a compatible unconnected terminal on the matching module instance and calls `clicked_terminal` to complete the connection.
