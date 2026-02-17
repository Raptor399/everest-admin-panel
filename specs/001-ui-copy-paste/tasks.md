---
description: "Task list for Copy/Paste Modules feature"
---

# Tasks: Copy/Paste Modules

**Input**: Design documents from `/specs/001-ui-copy-paste/`
**Prerequisites**: plan.md, spec.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify `just-clone` dependency is available (used in `config_model.ts`)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T002 Define Clipboard types (`ClipboardSnapshot`, `CopiedModule`, `CopiedConnection`) in `src/modules/evconf_konva/types.ts` (or new file)
- [X] T003 Update `ConfigStageContext` in `src/modules/evconf_konva/stage_context.ts` to support multi-selection state (`Set<ModuleInstanceID>`)

**Checkpoint**: Foundation ready - user story implementation can now begin

## Phase 3: User Story 3 - Canvas Selection & Dragging (Priority: P1)

**Goal**: Enable multi-selection via Shift+Click and Rectangle Drag to support group operations, and restore panning via Right-Click.

**Independent Test**: Shift-click multiple modules, drag one to move all. Drag rectangle on background (Left-Click) to select multiple. Drag background (Right-Click) to pan. Click Zoom In/Out buttons to scale canvas.

### Implementation for User Story 3

- [X] T004 [US3] Implement `select_instances` and `toggle_instance_selection` methods in `src/modules/evconf_konva/stage_context.ts`
- [X] T005 [US3] Update `ModuleView` in `src/modules/evconf_konva/views/module.ts` to handle Shift+Click (additive selection)
- [X] T006 [US3] Implement rectangle drag selection logic (Left-Click) in `src/modules/evconf_konva/config_stage.ts`
- [X] T007 [US3] Implement manual panning logic (Right-Click) in `src/modules/evconf_konva/config_stage.ts`
- [X] T008 [US3] Implement Zoom In/Out logic in `src/modules/evconf_konva/config_stage.ts` (methods `zoomIn`, `zoomOut`)
- [X] T009 [US3] Add Zoom In/Out buttons to `src/components/EvConfigCanvas.vue` and bind to `ConfigStage` methods
- [X] T010 [US3] Implement visual feedback for multi-selection in `ModuleView` (update stroke/highlight based on selection state)
- [X] T011 [US3] Update `ModuleView` drag handler to move ALL selected modules when one is dragged
- [X] T012 [US3] Update right bar logic to detect multi-selection and show a 'Multiple items selected' placeholder state
- [X] T013 [US3] Implement evaluating/disabling mouse wheel zoom

**Checkpoint**: Multi-selection, group dragging, panning, and zooming working.

## Phase 4: User Story 1 - Copy & Paste Modules (Priority: P1)

**Goal**: Enable duplicating modules with unique names and preserved connections.

**Independent Test**: Select modules -> Copy -> Paste. Verify new modules appear with " (1)" suffix and internal connections.

### Implementation for User Story 1

- [X] T014 [US1] Implement `Smart Increment` name generation utility in `src/modules/evbc/utils.ts` (or `config_model.ts`)
- [X] T015 [US1] Implement `Copy` logic in `src/modules/evconf_konva/config_stage.ts`: serialize selected modules to `ClipboardSnapshot`
- [X] T016 [US1] Implement `Paste` logic in `src/modules/evconf_konva/config_stage.ts`: deserialize, generate names, map IDs, recreate connections, apply offset (+2 grid units)
- [X] T017 [US1] Register keyboard shortcuts (Cmd/Ctrl+C, Cmd/Ctrl+V) in `src/modules/evconf_konva/config_stage.ts`
- [X] T018 [US1] Add visual confirmation (Toast) for Copy and Cut actions using Vuetify `VSnackbar`

**Checkpoint**: Copy/Paste working for single and multiple modules.

## Phase 5: User Story 2 - Cut & Paste Modules (Priority: P2)

**Goal**: Enable moving modules via Cut/Paste.

**Independent Test**: Select -> Cut (disappears) -> Paste (reappears).

### Implementation for User Story 2

- [X] T019 [US2] Implement `Cut` logic in `src/modules/evconf_konva/config_stage.ts`: Copy + Delete selected instances
- [X] T020 [US2] Register keyboard shortcut (Cmd/Ctrl+X) in `src/modules/evconf_konva/config_stage.ts`

**Checkpoint**: Cut/Paste working.

## Phase 6: Polish & Cross-Cutting

- [X] T021 Verify performance with ~50 modules (ensure no lag during drag/paste)

## Phase 7: Testing & Verification (Constitution Principle II)

- [X] T023 [Test] Write Unit Tests for Smart Increment logic in `src/modules/evbc/utils.test.ts` (create if needed)
- [X] T024 [Test] Verify FR-001 (Single selection) in E2E tests
- [X] T025 [Test] Verify FR-002 (Additive selection) in E2E tests
- [X] T026 [Test] Verify FR-003 (Rectangle selection) in E2E tests
- [X] T027 [Test] Verify FR-005 (Group dragging) in E2E tests
- [X] T028 [Test] Verify FR-004 (Right-click panning) in E2E tests
- [X] T029 [Test] Verify FR-006 (Copy), FR-007 (Cut), FR-008 (Paste) basic flow in E2E tests
- [X] T030 [Test] Verify FR-009 (Smart Increment naming) in E2E tests
- [X] T031 [Test] Verify FR-010 (Offset positioning) in E2E tests
- [X] T032 [Test] Verify FR-011 (Property retention) in E2E tests
- [X] T033 [Test] Verify FR-012 (Connection handling) in E2E tests
- [X] T034 [Test] Verify FR-013 (Right bar summary) in E2E tests
- [X] T035 [Test] Verify FR-014 (Toast confirmation) in E2E tests
- [X] T036 [Test] Verify FR-015 (Zoom buttons) in E2E tests
- [X] T037 [Test] Verify FR-016 (No mouse wheel events) in E2E tests
- [X] T038 [Test] Verify connected module dragging stability (EvseSecurity -> EvseV2G -> EvseManager) in `cypress/e2e/connected-drag.cy.ts`
- [X] T039 [Test] Verify multi-select dragging moves all selected modules in `cypress/e2e/multi-select-drag.cy.ts`
