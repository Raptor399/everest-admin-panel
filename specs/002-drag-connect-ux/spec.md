# Feature Specification: Intuitive Module Connection UX

**Feature Branch**: `feat/002-drag-connect-ux`  
**Created**: 2026-02-19  
**Status**: Draft
**Input**: User description: ```We're going to change the way connections are created between modules. Before, the user had to click a terminal on a module, then click one of the highlighted terminals or select an available module from the left column, and the new connection would appear. We're going to allow the user to use a more intuitive way of making connections and make what we want from the user more obvious. By making these changes:
- A "provide" terminal on a module is displayed with a plug icon pointing away from the module.
- A "requirement" terminal on a module is displayed with a socket icon.
- When the user clicks a terminal, it greys out all other terminals on the same module.
- When the user clicks a terminal, it greys out already connected modules as well as the connection lines to those modules.
- When the user clicks a terminal, only modules with unconnected compatible ("provide" versus "requirement") terminals are not greyed out.
- When the user clicks a terminal, its icon enlarges 50%. Same for compatible terminals on other modules.
- The user has three options to create the connection:
  1. Click one of the compatible terminals
  2. Click one of the available modules in the left bar
  3. Drag the terminal icon onto the desired terminal or module.
  Clicking anywhere else or releasing the dragged icon somewhere else will cancel the action.
- Whilst dragging, a dashed line will connect the dragged terminal icon to the module. The line originates in the original position of the terminal. The terminal icon will point in the direction of the line.
- Once connected, a line is drawn from one module to the other. The "provide" terminal switches to a filled circle icon. The "requirement" terminal switches to a filled arrowhead icon pointing to its module. The icons are changed back to their normal scale.```

## Clarifications

### Session 2026-02-19

- Q: What happens when a terminal is already connected and the user clicks it while it shows the connected icon? → A: A terminal may be connected to multiple compatible terminals simultaneously. Clicking an already-connected terminal enters the normal selection state; existing connections and the terminals at the other end of those connections are dimmed, and the user can add another connection from the same terminal.
- Q: How are already-connected modules distinguished from incompatible-but-unconnected modules in the dimmed state? → A: A module is evaluated normally — its already-connected terminals (to the originating terminal) are excluded from consideration, but any remaining compatible and not-yet-connected terminals keep the module highlighted. A module is only dimmed when it has no compatible terminals left that are not already connected to the originating terminal. One terminal may connect to multiple modules or to multiple terminals on the same module.
- Q: What happens when a module has multiple compatible terminals of the same interface? → A: All compatible terminals on that module are independently highlighted; the user selects the specific one. When dragging and releasing over a module body (not a specific terminal), the nearest compatible terminal is connected.
- Q: What happens when no compatible target exists anywhere on the canvas after clicking a terminal? → A: The selection state is still entered but no targets are highlighted; the canvas is fully dimmed; clicking anywhere cancels the selection.
- Q: During drag, how does the icon behave when the cursor leaves the canvas bounds? → A: The drag is cancelled as if released over a non-target area.

## Overview

This feature redesigns the module connection workflow in the EVerest Admin Panel canvas. The goal is to replace the existing implicit flow — where users had to click a terminal and then figure out what to do next — with a visually guided, discoverable interaction that communicates affordances clearly through iconography, progressive disclosure of compatible targets, and support for both click and drag gestures.

Two types of connections exist between modules:

- **Provide terminals**: A module exposes a capability for others to use.
- **Requirement terminals**: A module declares a need that another module's provide terminal must fulfill.

A valid connection always links exactly one "provide" terminal to one "requirement" terminal of the same interface type.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Terminal Types at a Glance (Priority: P1)

An operator opening the canvas for the first time needs to understand, without any tooltip or documentation, which terminals on each module produce capabilities and which terminals consume them. Today all terminals look the same, creating ambiguity. With this change, a distinct directional icon on each terminal communicates its role immediately.

**Why this priority**: Without legible terminal icons the rest of the improved connection flow cannot be evaluated. This is a prerequisite for all other stories and delivers standalone value for orientation on a complex canvas.

**Independent Test**: Can be fully tested by placing two or more modules on the canvas and verifying that: (a) every "provide" terminal displays a plug-like icon oriented away from its module, and (b) every "requirement" terminal displays a socket-like icon, before any connection is attempted.

**Acceptance Scenarios**:

1. **Given** a canvas with at least two modules, **When** the user views the canvas without interacting, **Then** every "provide" terminal is marked with a plug icon that visually points outward from the module body.
2. **Given** a canvas with at least two modules, **When** the user views the canvas without interacting, **Then** every "requirement" terminal is marked with a socket icon.
3. **Given** a module with both "provide" and "requirement" terminals, **When** the user looks at the module, **Then** the two icon types are visually distinct enough to tell apart without a legend.

---

### User Story 2 - Connect Modules by Clicking Compatible Terminals (Priority: P2)

An operator wants to wire two modules together. After clicking a terminal, the canvas immediately communicates which other terminals are valid connection targets by dimming everything else, enlarging the clicked terminal and all compatible targets, and greying out anything that is already connected or incompatible. The operator then clicks one of the highlighted target terminals (or an available module in the left panel) to complete the connection.

**Why this priority**: Click-to-connect is the primary interaction path. It covers the core use case of creating a connection and delivers a complete, usable connection workflow on its own.

**Independent Test**: Can be fully tested by clicking a "provide" terminal, confirming the visual state changes described below, then clicking a compatible "requirement" terminal on another module and verifying a connection line appears.

**Acceptance Scenarios**:

1. **Given** a canvas with two or more modules that share a compatible interface, **When** the user clicks a "provide" terminal, **Then** all other terminals on the same module are dimmed; any existing connections from that terminal and the terminals at the other ends of those connections are dimmed; all "provide" terminals on other modules are dimmed; and all "requirement" terminals on other modules that are compatible and not already connected to this terminal are fully visible and enlarged by 50%. A module is only fully dimmed when it has no compatible terminals left that are not already connected to the clicked terminal.
2. **Given** the selection state above is active, **When** the user clicks one of the highlighted compatible "requirement" terminals, **Then** a connection line is drawn between the two modules, both terminals return to normal scale, and the canvas returns to its idle state.
3. **Given** the selection state above is active, **When** the user clicks one of the available modules displayed in the left panel, **Then** a connection is created between the selected terminal and the compatible terminal of that module, the connection line appears on canvas, and both terminals return to normal scale.
4. **Given** the selection state above is active, **When** the user clicks anywhere on the canvas that is not a compatible terminal or module in the left panel, **Then** the selection is cancelled, all dimming and scaling is reversed, and the canvas returns to its idle state.
5. **Given** the selection state above is active initiated by clicking a "requirement" terminal, **When** the rules above are applied symmetrically, **Then** only unconnected "provide" terminals with a matching interface are highlighted and compatible modules are shown in the left panel.

---

### User Story 3 - Connect Modules by Dragging a Terminal Icon (Priority: P3)

An operator prefers a spatial, direct-manipulation interaction. They want to grab a terminal icon and drag it onto the target module or terminal. The canvas provides real-time visual feedback during the drag: the terminal icon detaches and follows the cursor with a dashed line trailing back to the terminal's original position, the icon rotates to point along the direction of the line, and valid targets remain highlighted. Releasing over a valid target completes the connection; releasing elsewhere cancels.

**Why this priority**: Drag-to-connect is an alternative connection method. It adds discoverability and is often faster for power users, but the click-to-connect workflow already covers the functional need.

**Independent Test**: Can be tested independently by dragging a "provide" terminal icon onto a compatible "requirement" terminal on another module and confirming a connection is created, without needing the click interaction to be present.

**Acceptance Scenarios**:

1. **Given** the idle canvas, **When** the user begins dragging a terminal icon, **Then** the same canvas dimming and enlarging rules as in User Story 2 are applied for compatible targets.
2. **Given** a drag in progress, **When** the cursor moves on the canvas, **Then** a dashed line is drawn from the terminal's original fixed position to the current cursor position, and the terminal icon follows the cursor and rotates to face away from the origin of the dashed line.
3. **Given** a drag in progress, **When** the user releases the terminal icon over a compatible target terminal, **Then** a connection is made, the dashed line disappears, the terminal icon returns to its original position and scale, and the connected state icons are shown.
4. **Given** a drag in progress, **When** the user releases the terminal icon over a compatible module in the canvas (not necessarily over the specific terminal), **Then** a connection is created using the nearest compatible terminal of that module, same as releasing over that terminal directly.
5. **Given** a drag in progress, **When** the user releases the terminal icon anywhere other than a compatible target, **Then** the drag is cancelled, the icon snaps back to its original position, dimming is removed, and the canvas returns to its idle state.

---

### User Story 4 - See Connected State in Terminal Icons (Priority: P4)

After a connection is established, the operator needs a glanceable indication that the terminals are occupied. The terminal icons switch to a "connected" visual: "provide" terminals become a filled circle and "requirement" terminals become a filled arrowhead pointing inward toward the module.

**Why this priority**: This story delivers passive, persistent visual feedback. It depends on connections existing (User Story 2 or 3) but can be validated independently once any connection is present.

**Independent Test**: Can be tested independently by loading a configuration that already has connections set up and verifying the connected icon states without performing any new connection actions.

**Acceptance Scenarios**:

1. **Given** a "provide" terminal that has been connected to a "requirement" terminal, **When** the canvas re-renders in its idle state, **Then** the "provide" terminal shows a filled circle icon at normal scale.
2. **Given** a "requirement" terminal that has been connected to a "provide" terminal, **When** the canvas re-renders in its idle state, **Then** the "requirement" terminal shows a filled arrowhead icon pointing toward its own module at normal scale.
3. **Given** a connection that is removed from a module, **When** the canvas re-renders, **Then** both terminals revert to their unconnected icons (plug and socket respectively).

---

### Edge Cases

- **Already-connected terminal clicked**: A terminal may connect to more than one compatible terminal. Clicking an already-connected terminal enters the normal selection state. All existing connections originating from that terminal, and the terminals at the other ends of those connections, are dimmed as occupied. The user can then add another connection from the same terminal using the standard click or drag flow.
- **Already-connected module dimming**: A module is evaluated normally when another terminal is selected. For each terminal on that module, if it is already connected to the originating terminal it is treated as occupied and excluded from consideration; otherwise it remains eligible. A module is dimmed only when every one of its compatible terminals is already connected to the originating terminal (i.e., no new connection can be made). This also means a single terminal may connect to multiple terminals on the same module.
- **Multiple compatible terminals on the same module**: All eligible compatible terminals on that module are independently highlighted and selectable. When the user drags and releases over the module body rather than a specific terminal, the connection is made to the nearest compatible terminal.
- **No compatible target on canvas**: The selection state is entered normally, but no terminals or modules are highlighted. The canvas is fully dimmed. Clicking anywhere cancels the selection.
- **Cursor leaves canvas bounds during drag**: The drag ends as if the icon were released over a non-target area — the interaction is cancelled, the icon returns to its original position, and dimming is cleared.

## Requirements *(mandatory)*

### Functional Requirements

#### Terminal Icons — Idle State

- **FR-001**: Each "provide" terminal MUST display a plug-shaped icon that visually points away from the module body in the idle (unconnected, unselected) state.
- **FR-002**: Each "requirement" terminal MUST display a socket-shaped icon in the idle (unconnected, unselected) state.

#### Terminal Icons — Connected State

- **FR-003**: Each "provide" terminal that is connected MUST display a filled circle icon in the idle connected state.
- **FR-004**: Each "requirement" terminal that is connected MUST display a filled arrowhead icon pointing toward its module in the idle connected state.

#### Selection State — Visual Feedback

- **FR-005**: When a terminal is clicked, all other terminals on the same module MUST be visually dimmed.
- **FR-006**: When a terminal (the "originating terminal") is selected, a module MUST be dimmed if and only if every compatible terminal on that module is already connected to the originating terminal (no further connection can be made). If the module has at least one compatible terminal that is not yet connected to the originating terminal, the module MUST remain fully visible and that terminal MUST be highlighted. Connection lines between the originating terminal and terminals it is already connected to MUST be dimmed alongside those occupied terminals.
- **FR-007**: When a terminal is clicked, all terminals on other modules that are not compatible (i.e., opposite type — "provide" vs "requirement" — and matching interface) MUST be visually dimmed.
- **FR-008**: When a terminal is clicked, the clicked terminal's icon MUST scale up by 50%.
- **FR-009**: When a terminal is clicked, every compatible terminal on other modules not already connected to the originating terminal MUST scale up by 50% and remain fully visible.
- **FR-010**: The left panel MUST update when a terminal is selected to show only modules that have at least one compatible terminal not already connected to the originating terminal.

#### Completing a Connection

- **FR-011**: Clicking a highlighted compatible terminal while a terminal is selected MUST create a connection between the two terminals and return the canvas to the idle state.
- **FR-012**: Clicking an available module in the left panel while a terminal is selected MUST create a connection between the selected terminal and a compatible terminal on that module and return the canvas to the idle state.
- **FR-013**: Clicking anywhere on the canvas that is not a compatible terminal or valid left-panel module while a terminal is selected MUST cancel the selection and return the canvas to the idle state with no connection created.

#### Drag Interaction

- **FR-014**: Beginning a drag gesture on a terminal icon MUST trigger the same visual selection state as clicking the terminal (FR-005 through FR-010).
- **FR-015**: During a drag, a dashed line MUST be drawn continuously from the terminal's fixed original position to the current cursor position.
- **FR-016**: During a drag, the terminal icon MUST follow the cursor and MUST rotate so that it faces away from the fixed origin of the dashed line.
- **FR-017**: Releasing the drag over a compatible target terminal MUST create a connection and return the canvas to the idle state.
- **FR-018**: Releasing the drag over a canvas area containing a compatible module (but not over a specific terminal) MUST create a connection using the nearest compatible terminal on that module.
- **FR-019**: Releasing the drag over any area that is not a valid target MUST cancel the interaction with no connection created and return the terminal icon to its original position.

#### Post-Connection State

- **FR-020**: After a connection is created, both terminals MUST display their connected icons (filled circle for "provide", filled arrowhead for "requirement") at normal scale.
- **FR-021**: A connection line MUST be visible between connected modules on the canvas while in the idle state.

### Key Entities

- **Module**: A functional unit on the canvas that exposes one or more terminals. Each module has a type, a name, and a visual position.
- **Terminal**: A connection point on a module. Has a role ("provide" or "requirement") and an interface type. Can be unconnected or connected to any number of terminals of the opposite role with the same interface type; there is no upper limit on connections per terminal.
- **Connection**: A link between exactly one "provide" terminal and one "requirement" terminal sharing the same interface type. Represented visually as a line between the two modules.
- **Interface Type**: A named contract that determines which "provide" and "requirement" terminals are compatible with each other.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user unfamiliar with the tool can correctly identify which terminals are "provide" and which are "requirement" on first viewing, without documentation, with a success rate of 90% or higher.
- **SC-002**: A user can complete a module connection in under 30 seconds from first clicking a terminal, using either the click or drag method.
- **SC-003**: The number of accidental or incomplete connection attempts (clicks that fail to produce a connection) is reduced by at least 60% compared to the previous interaction model.
- **SC-004**: The canvas selection state (dimming, scaling) is perceived as instantaneous — users report no visible lag between their click or drag start and the visual response.
- **SC-005**: All terminal icons and connection line states correctly reflect the underlying connection data at all times, with zero cases of stale or mismatched visual state after any user action.
- **SC-006**: The drag-to-connect and click-to-connect methods both produce identical connection outcomes for the same source and target terminals.

## Assumptions

- A terminal may be connected to any number of compatible terminals simultaneously (one-to-many and many-to-many connections are supported). The connected icon state is shown as soon as at least one connection exists.
- When a connection is removed both endpoint terminals MUST revert to their unconnected icons if they have no remaining connections.
- The "provide" vs "requirement" vocabulary and interface-type matching logic already exist in the underlying data model and do not need to be introduced as part of this feature.
- The left panel module list already supports filtering; this feature reuses that mechanism to show only compatible modules during selection.
- Icon assets (plug, socket, filled circle, filled arrowhead) will be sourced or created as part of implementation; the spec does not prescribe their visual style beyond the directional and filled/outline distinction described.
