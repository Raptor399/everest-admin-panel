# Implementation Plan: Intuitive Module Connection UX

**Branch**: `002-drag-connect-ux` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/002-drag-connect-ux/spec.md`

## Summary

Replace the existing two-click terminal connection flow with a visually guided interaction: distinct plug/socket icons per terminal role, progressive dimming/highlighting when a terminal is selected, mutual one-to-many connection support, and a drag-to-connect gesture with a dashed preview line. All visual logic lives inside the `evconf_konva` rendering layer (Konva.js) and the existing `ConfigStageContext` / `ConnectionManager` plumbing; Vue components are touched only for left-panel filtering.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Konva.js 9.x (canvas rendering), Vue 3 / Composition API, Pinia, Vuetify 3; no new runtime dependencies required  
**Storage**: N/A — all state is runtime-only canvas state derived from `EVConfigModel`  
**Testing**: Vitest (unit), Cypress (E2E)  
**Target Platform**: Desktop browser (Chromium / Firefox / Safari)  
**Project Type**: Web application (single-page, frontend-only canvas feature)  
**Performance Goals**: All drag/animation callbacks MUST complete within 16 ms (60 fps); Konva tween animations target 150 ms duration for scale transitions  
**Constraints**: Must preserve the existing `EVConfigModel` data contract unchanged; no new npm packages; no breaking changes to `ConnectionID` / `ModuleInstanceID` / `Terminal` types exported from `evbc`  
**Scale/Scope**: Affects ~8 files across `evconf_konva/`; left-panel Vue component receives one new reactive prop/event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I — Code Quality | ✅ PASS | All new code is strictly typed. New appearance states modelled as a discriminated union `TerminalVisualState`. No `any` introduced. |
| II — Testing Standards | ⚠ MUST ADD | Vitest unit tests required for: `TerminalVisualStateResolver` (compatibility + dimming logic), `DragPreviewOverlay`. Cypress E2E tests required for: click-to-connect flow, drag-to-connect flow, and cancellation. |
| III — UX Consistency | ✅ PASS | Reuses existing Konva shape patterns (`Konva.Path`, `Konva.Line`). Shared tooltip and cursor behaviour unchanged. |
| IV — Performance | ✅ PASS with guard | Drag `mousemove` handler throttled via RAF flag. Scale transitions use `Konva.Tween` (hardware-accelerated). Dimming applied via `opacity()` on groups (single GPU composite operation). |
| V — Runtime Safety | ✅ PASS | No external inputs: terminal metadata is already validated by the time it reaches the canvas layer. |

No gate violations. No complexity tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/002-drag-connect-ux/
├── plan.md              ← this file
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
└── contracts/
    └── canvas-state.ts  ← Phase 1 (TypeScript interface contracts)
```

### Source Code (repository root)

```text
src/modules/evconf_konva/
├── views/
│   ├── constants.ts          ← add ICON_DATA entries + COLOR entries
│   ├── shapes/
│   │   ├── terminal.ts       ← add new visual states + scale tween
│   │   ├── terminal.test.ts  ← NEW
│   │   └── connection.ts     ← add opacity dimming method
│   └── module.ts             ← implement _terminal_drag* handlers;
│                                 add DragPreviewOverlay management
├── view_models/
│   └── module.ts             ← update _handle_stage_context_event for
│                                 multi-connection awareness + new dimming rules
├── stage_context.ts          ← extend TerminalSelection to carry instance_id;
│                                 add drag_terminal_{start,move,end} methods;
│                                 update clicked_terminal for multi-connection
├── connection_manager.ts     ← add get_terminal_connections(); is_connected_pair()
└── connection_manager.test.ts      ← NEW / extend existing
└── config_stage.ts           ← wire stage-level mouseup for drag cancel on
│                                 out-of-bounds release
src/components/
└── EvConfigCanvas.vue        ← pass terminal-selection state to EvModuleList
                                 so left panel filters compatible modules
src/pages/
└── MainPanel.vue             ← no change expected

cypress/e2e/
└── drag-connect-ux.cy.ts           ← NEW
```

**Structure Decision**: Single web application (Option 2 header stripped). All changes are isolated to the `evconf_konva` canvas subsystem and one Vue component surface point. No new project or package required.

