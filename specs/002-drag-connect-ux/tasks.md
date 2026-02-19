# Tasks: Intuitive Module Connection UX

**Feature**: `002-drag-connect-ux` | **Date**: 2026-02-19  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Total tasks**: 34 | **Parallelizable**: 17

---

## Implementation Strategy

Deliver value incrementally by story. US1 alone ships meaningful value (readable terminals). US2 completes the primary interaction. US3 and US4 enhance it.

**MVP scope**: US1 + US2 (Phases 1–4). US3 (drag) and US4 (connected icons on load) are additive.

**Test approach**: Unit tests for logic (Vitest); E2E tests for user flows (Cypress). Both added per story.

---

## Phase 1: Setup

*Create all new files and stubs so no phase later has to also create a file.*

- [X] T001 Create stubs for three new files: `src/modules/evconf_konva/views/shapes/terminal.test.ts` (describe block with `it.todo()` entries for icon/fill assertions), `src/modules/evconf_konva/connection_manager.test.ts` (describe block with `it.todo()` entries for pair-query assertions), `cypress/e2e/drag-connect-ux.cy.ts` (describe block with `it.todo()` entries for all E2E flows), and `src/modules/evconf_konva/types.ts` to hold union type exports
- [X] T002 [P] Create `src/modules/evconf_konva/drag_preview_overlay.ts` as an empty exported class skeleton (used in Phase 5)

---

## Phase 2: Foundational

*Shared infrastructure required by all user story phases. MUST complete before Phase 3.*

- [X] T003 Add four new SVG path constants to `src/modules/evconf_konva/views/constants.ts`: `ICON_DATA.TERMINAL_PROVIDE`, `ICON_DATA.TERMINAL_REQUIREMENT`, `ICON_DATA.TERMINAL_PROVIDE_CONNECTED`, `ICON_DATA.TERMINAL_REQUIREMENT_CONNECTED`
- [X] T004 [P] Add `TerminalVisualState` and `ModuleVisualState` discriminated union type exports to `src/modules/evconf_konva/types.ts` (matching `contracts/canvas-state.ts`)
- [X] T005 [P] Add `is_connected_pair(provideModule, provideTerminalLookupId, requireModule, requireTerminalLookupId): boolean` and `get_connections_for_terminal(moduleView, terminalLookupId): TerminalConnectionsResult` to `src/modules/evconf_konva/connection_manager.ts`
- [X] T006 [P] Extend `TerminalSelection` type in `src/modules/evconf_konva/stage_context.ts` to include `module_instance_id: ModuleInstanceID`, and update `_current_selected_terminal` storage accordingly. Add `drag_terminal_{start,move,end}` methods to route drag lifecycle calls. `ModuleView` drag handlers MUST call these routing methods (not bypass them), so all drag lifecycle events flow through `stage_context` observers.

---

## Phase 3: User Story 1 — Terminal Type Icons at a Glance

**Story goal**: Every "provide" terminal shows a plug icon pointing away from the module; every "requirement" terminal shows a socket icon. Independently testable without any click interaction.

**Independent test criteria**: Load any config with modules; verify icon shapes match terminal roles before any interaction.

- [X] T007 [US1] Update `TerminalShape` constructor in `src/modules/evconf_konva/views/shapes/terminal.ts` to select `ICON_DATA.TERMINAL_PROVIDE` or `ICON_DATA.TERMINAL_REQUIREMENT` based on `terminal_type` instead of the shared `ICON_DATA.TERMINAL`
- [X] T008 [US1] Update `TerminalShape.set_alignment()` in `src/modules/evconf_konva/views/shapes/terminal.ts` to correctly handle the directional orientation of the two new icon paths (plug prongs point away from module; socket opening points away)
- [X] T009 [US1] Add `set_visual_state(state: TerminalVisualState): void` to `TerminalShape` in `src/modules/evconf_konva/views/shapes/terminal.ts` — implement `idle-unconnected` and `idle-connected` states (swap `data` path, update `fill`, reset `scale` to 1×, reset `opacity` to 1)
- [X] T010 [US1] Write Vitest unit tests in `src/modules/evconf_konva/views/shapes/terminal.test.ts`: verify `TerminalShape` selects correct icon path and fill for both `provide` and `requirement` roles in `idle-unconnected` and `idle-connected` states

---

## Phase 4: User Story 2 — Click-to-Connect Flow

**Story goal**: Clicking a terminal enters a guided selection state with dimming/highlighting. Clicking a compatible terminal or a left-panel module completes the connection. Clicking elsewhere cancels. Supports multiple connections per terminal.

**Independent test criteria**: Click a provide terminal → verify dimming + highlighting; click a compatible requirement terminal → verify connection line appears; click canvas background → verify state resets.

- [X] T011 [US2] Rewrite `ModuleViewModel._handle_stage_context_event` in `src/modules/evconf_konva/view_models/module.ts` to compute the full 7-state `TerminalVisualState` for each terminal using `ConnectionManager.is_connected_pair()` and `get_connections_for_terminal()`, replacing the existing 3-bucket disable/highlight/normal logic
- [X] T012 [P] [US2] Implement remaining `TerminalVisualState` cases in `TerminalShape.set_visual_state()` in `src/modules/evconf_konva/views/shapes/terminal.ts`: `selected` (scale 1.5× via `node.to()`), `compatible-target` (scale 1.5×, full opacity), `dimmed-same-module` / `dimmed-incompatible` / `dimmed-exhausted` (opacity 0.25, no scale change)
- [X] T013 [P] [US2] Update `ModuleView` in `src/modules/evconf_konva/views/module.ts` to derive `ModuleVisualState` from its terminals' computed states and apply `group.opacity(0.35)` or `group.opacity(1)` accordingly. States `idle`, `active`, and `has-compatible` all use `opacity(1)`; only `dimmed` uses `opacity(0.35)`
- [X] T014 [P] [US2] Add `set_dimmed(dimmed: boolean): void` to `ConnectionShape` in `src/modules/evconf_konva/views/shapes/connection.ts`; call it from `ConnectionManager` when a terminal is selected (dim connections that involve the selected terminal's already-connected targets)
- [X] T015 [US2] Update `stage_context.ts` `clicked_terminal()` to support multi-connection: always create the connection when a second compatible terminal is clicked regardless of existing connections, then call `unselect()` to return to idle
- [X] T016 [P] [US2] Add a reactive `terminalFilter: Ref<LeftPanelTerminalFilter | null>` to `src/components/EvConfigCanvas.vue`, populated on `SELECT TERMINAL` events and cleared on `SELECT NONE`
- [X] T017 [P] [US2] Update `src/components/EvModuleList.vue` to accept the `terminalFilter` prop and filter displayed modules to only those with at least one compatible unconnected terminal (using `interfaces_match` via the evbc store)
- [X] T018 [US2] Add `clicked_left_panel_module(moduleInstanceId: ModuleInstanceID): void` to `stage_context.ts`; wire the left-panel module click event in `EvConfigCanvas.vue` to call it; method finds the correct compatible terminal and calls `clicked_terminal()` to complete the connection
- [X] T019 [US2] Verify that canvas background click (`e.target === stage || e.target === bg`) during selection mode calls `stage_context.unselect()` and that `unselect()` resets all terminal visual states to idle in `src/modules/evconf_konva/config_stage.ts`
- [X] T020 [US2] Write Vitest unit tests in `src/modules/evconf_konva/views/shapes/terminal.test.ts`: cover all 7 `TerminalVisualState` assignments for a representative 3-module scenario including multi-connection cases and the exhausted-module case; write unit tests in `src/modules/evconf_konva/connection_manager.test.ts` covering `is_connected_pair()` and `get_connections_for_terminal()`
- [X] T021 [US2] Write Cypress E2E tests in `cypress/e2e/drag-connect-ux.cy.ts`: click-to-connect happy path, left-panel connect, multi-connection (second connection from same terminal), and canvas-click cancellation, as well as connection line visibility after creation

---

## Phase 5: User Story 3 — Drag-to-Connect

**Story goal**: Dragging a terminal icon shows a ghost icon + dashed preview line; releasing over a valid target creates a connection; releasing elsewhere cancels. Independently testable without using the click-to-connect flow.

**Independent test criteria**: Drag a provide terminal → ghost appears + dashed line → release on compatible requirement terminal → connection made; drag and release on empty area → no connection, ghost snaps back.

- [X] T022 [US3] Implement `DragPreviewOverlay` class in `src/modules/evconf_konva/drag_preview_overlay.ts`: constructor accepts `DragPreviewConfig`; creates a dedicated `Konva.Layer` above `static_layer` containing a ghost `Konva.Path` (1.5× scale) and a dashed `Konva.Line`; exposes `update(cursorPos)` and `destroy()` methods
- [X] T023 [US3] Update `ModuleView._terminal_dragstart_handler()` in `src/modules/evconf_konva/views/module.ts`: call `e.target.stopDrag()` to cancel native Konva drag, capture terminal absolute position, trigger the same selection-state broadcast as a click (dimming/highlighting), and construct a `DragPreviewOverlay`
- [X] T024 [P] [US3] Update `ModuleView._terminal_dragmove_handler()` in `src/modules/evconf_konva/views/module.ts`: call `overlay.update(stagePointerPos)` to move the ghost and extend the dashed line; compute angle from origin to cursor and set `ghostShape.rotation()` so the ghost icon faces away from origin; throttle with a RAF flag to stay within 16 ms
- [X] T025 [US3] Update `ModuleView._terminal_dragend_handler()` in `src/modules/evconf_konva/views/module.ts`: call `stage.getIntersection()` at pointer position; if result is a `TerminalShape` with compatible type → call `clicked_terminal()` directly; if the result shape is any child of a module group (frame Rect, title Text, top stroke Line) → resolve the parent module view and find nearest compatible terminal by Euclidean distance and connect; otherwise call `stage_context.unselect()`; always call `overlay.destroy()`
- [X] T026 [P] [US3] Add a `window.addEventListener('mouseup', ...)` fallback in `src/modules/evconf_konva/config_stage.ts` that fires `stage_context.unselect()` and destroys any active `DragPreviewOverlay` when the mouse is released outside the canvas element
- [X] T027 [US3] Write Cypress E2E tests in `cypress/e2e/drag-connect-ux.cy.ts`: drag-to-compatible-terminal success, drag-release-on-module-body (nearest terminal), and drag-cancel via release on empty canvas area

---

## Phase 6: User Story 4 — Connected State Icons

**Story goal**: After a connection is made, both terminals show their connected icons (filled circle / filled arrowhead) in idle state. Persists across page reload.

**Independent test criteria**: Load a saved config with at least one existing connection; verify connected icons without performing any interaction.

- [X] T028 [US4] After `ADD_CONNECTION` event is processed in `src/modules/evconf_konva/config_stage.ts`, re-evaluate and apply `set_visual_state('idle-connected')` on both endpoint terminals via their respective `ModuleView`s
- [X] T029 [P] [US4] On initial config load in `src/modules/evconf_konva/config_stage.ts`, after all `ModuleView`s and connections are created, iterate all terminals and call `set_visual_state('idle-connected')` for any terminal that has ≥1 connection in `ConnectionManager`
- [X] T030 [US4] Write Vitest unit tests in `src/modules/evconf_konva/views/shapes/terminal.test.ts`: `idle-connected` icon and fill shown after connection add; reverts to `idle-unconnected` icon after connection removal- [X] T034 [US4] When a connection is deleted, call `set_visual_state('idle-unconnected')` on both endpoint terminals (if they have no remaining connections) via their respective `ModuleView`s; wire this to the existing connection-deletion path in `src/modules/evconf_konva/config_stage.ts`
---

## Phase 7: Polish & Cross-Cutting

- [X] T031 [P] Verify RAF throttle flag is present in `ModuleView._terminal_dragmove_handler()` in `src/modules/evconf_konva/views/module.ts`; add if missing
- [X] T032 [P] Run `pnpm vue-tsc` and `pnpm lint`; resolve all TypeScript type errors and ESLint violations introduced by this feature across all modified files
- [ ] T033 PR checklist: confirm Vitest unit tests pass (`pnpm test`), Cypress E2E tests pass (`pnpm run test:e2e`), no `any` types introduced without justifying comment, Constitution principles I–V satisfied. Manually verify via DevTools Performance panel that terminal click → visual state update completes within one frame on a mid-range machine.

---

## Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational: T003–T006)
        └── Phase 3 (US1: T007–T010)          ← MVP start
              └── Phase 4 (US2: T011–T021)     ← MVP complete
                    ├── Phase 5 (US3: T022–T027)
                    │     └── Phase 7 (Polish: T031–T033)
                    └── Phase 6 (US4: T028–T030, T034)
                          └── Phase 7 (Polish: T031–T033)
```

US3 and US4 are independent of each other once Phase 4 is complete and may be done in parallel.

---

## Parallel Execution Examples

### Within Phase 2 (foundational)
T003 and T004 touch different files — run in parallel.  
T005 and T006 touch different concerns in different files — run in parallel.

### Within Phase 3 (US1)
T008 and T009 both extend `TerminalShape` — sequential within the file, but T010 (test) can start after T007 and T009 are done.

### Within Phase 4 (US2)
T012, T013, T014 touch different files — run in parallel after T011.  
T016, T017 touch different Vue components — run in parallel.  
T020 (unit test) can run in parallel with T018 and T019.

### Within Phase 5 (US3)
T023 and T024 both edit `ModuleView` — sequential.  
T026 (config_stage fallback) is independent of T022–T025 — run in parallel with T022.

### Phase 5 and Phase 6 in parallel
Once Phase 4 is complete, T022–T027 (US3) and T028–T030 (US4) may be worked simultaneously by different contributors.
