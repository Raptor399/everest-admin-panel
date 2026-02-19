# Data Model: Intuitive Module Connection UX

**Feature**: 002-drag-connect-ux  
**Date**: 2026-02-19

---

## Overview

This feature introduces no new persistent data. All state described below is runtime-only canvas state derived from `EVConfigModel`. The `EVConfigModel` data contract is unchanged.

---

## Entity: TerminalVisualState

Represents the visual rendering state of a single terminal icon at any given moment.

```
TerminalVisualState (discriminated union)
├── "idle-unconnected"     – default idle state, no current selection active
│                            Icon: role-specific (plug or socket), normal scale
│
├── "idle-connected"       – idle state, this terminal has ≥1 connection
│                            Icon: role-specific connected (filled circle or arrowhead), normal scale
│
├── "selected"             – this is the terminal the user clicked/is dragging
│                            Icon: role-specific unconnected, scale 1.5×, full opacity
│
├── "compatible-target"    – another terminal was selected; this one is a valid target
│                            (opposite type, matching interface, not already connected to origin)
│                            Icon: role-specific unconnected if unconnected, connected if connected-to-others,
│                            scale 1.5×, full opacity
│
├── "dimmed-same-module"   – another terminal on the SAME module as the selected terminal
│                            Icon: current icon unchanged, opacity 0.25, hit-testing preserved
│
├── "dimmed-incompatible"  – wrong role or wrong interface type; not a valid target
│                            Icon: current icon unchanged, opacity 0.25
│
└── "dimmed-exhausted"     – compatible role and interface, but all such terminals on this module
                             are already connected to the originating terminal (no new connection possible)
                             Icon: current icon, opacity 0.25
```

**State transition triggers**:

| Event | Previous State | Next State |
|-------|---------------|-----------|
| User clicks a terminal (first click) | any | selected (clicked terminal); all others recomputed |
| User clicks compatible target terminal | compatible-target | idle (all terminals) |
| User clicks non-target area (canvas bg, etc.) | any during selection | idle (all terminals) |
| Connection added or removed | idle-unconnected / idle-connected | recomputed idle state based on connection count |
| Drag starts on terminal | any | selected (origin); others same as first click |
| Drag released on compatible target | compatible-target | idle (all terminals) |
| Drag released on non-target | any during drag | idle (all terminals, snap icon back) |

---

## Entity: ConnectionVisualState

Represents the opacity rendering state of a connection line during selection mode.

```
ConnectionVisualState
├── "idle"    – full opacity, clickable
└── "dimmed"  – opacity 0.25; the connection line links one or both ends to "dimmed" sets
```

A connection is dimmed whenever the selection is active and at least one of its endpoint terminals is in a dimmed state _or_ the connection is between the originating terminal and one of its already-connected targets (those existing connections dim to visually distinguish from the new connection being made).

---

## Entity: DragState (ephemeral)

Exists only while the user is actively dragging a terminal icon. Destroyed on drop or cancellation.

```
DragState
├── originTerminal        : Terminal & { module_instance_id: ModuleInstanceID }
│                           The terminal whose icon is being dragged
├── originAbsPosition     : { x: number; y: number }
│                           Absolute canvas position of the terminal icon centre,
│                           captured at dragstart and fixed for the duration
├── ghostShape            : Konva.Path
│                           Clone of the terminal icon, 1.5× scale, follows cursor
├── previewLine           : Konva.Line
│                           Dashed line from originAbsPosition to current cursor position
├── overlayLayer          : Konva.Layer
│                           Dedicated layer above static_layer; contains ghostShape + previewLine
└── cancelled             : boolean
                            Set to true on out-of-bounds mouseup or mousedown during drag
```

---

## Entity: TerminalCompatibilityKey

A lightweight value object used to test whether two terminals may be connected.

```
TerminalCompatibilityKey
├── type      : TerminalType     ("provide" | "requirement")
├── interface : string           (EVerest interface name, e.g., "ISO15118_charger")
└── instance_id : ModuleInstanceID
```

**Compatibility rule**: Two terminals are compatible if and only if:
1. Their types are opposite (`provide` ↔ `requirement`).
2. The provide terminal's `interface` satisfies the requirement terminal's `interface` (tested via the existing `EVConfigModel.interfaces_match(provide_interface, requirement_interface)` method).
3. The pair is not already connected (tested via `ConnectionManager.is_connected_pair()`).

---

## Entity: ModuleVisualState

Represents the overall opacity/visibility state of a module group on the canvas during selection mode.

```
ModuleVisualState
├── "idle"                – no selection active; full opacity, normal interaction
├── "active"              – the module that owns the selected terminal; full opacity
├── "has-compatible"      – module has ≥1 compatible-target terminal; full opacity
└── "dimmed"              – module has no compatible (or all compatible already connected to origin); opacity 0.35
```

`ModuleVisualState` is derived from the aggregate `TerminalVisualState` of its child terminals:
- If any terminal is `selected` → module is `active`.
- If any terminal is `compatible-target` → module is `has-compatible`.
- If all terminals are `dimmed-*` or `dimmed-same-module` → module is `dimmed`.
- Otherwise (no selection active) → module is `idle`.

---

## Validation Rules

| Rule | Description |
|------|-------------|
| VR-001 | A connection may only link one `provide` terminal to one `requirement` terminal. |
| VR-002 | Both terminals in a connection must share a compatible interface (checked by `EVConfigModel.interfaces_match`). |
| VR-003 | A `(providing_instance_id, providing_impl_name, requiring_instance_id, requirement_name)` tuple must be unique — no exact duplicate connections. |
| VR-004 | A terminal may be connected to any number of compatible terminals (one-to-many). |
| VR-005 | A terminal on a module may not be connected to itself (same instance, same terminal name). |

VR-001 through VR-003 are already enforced by `EVConfigModel`. VR-004 replaces the conceptual one-to-one assumption. VR-005 is implicit but should be guarded in the drop target evaluation.

---

## State Machine Diagram

```
                       ┌─────────────────────────────────┐
                       │           IDLE STATE             │
                       │  All terminals: idle-unconnected  │
                       │            or idle-connected      │
                       └──────────────┬──────────────────-┘
                                      │ user clicks a terminal
                                      ▼
                       ┌─────────────────────────────────┐
                       │        SELECTION ACTIVE          │
                       │  Origin: "selected" (scale 1.5×) │
                       │  Compatible: "compatible-target"  │
                       │  Others: "dimmed-*"              │
                       └──┬────────────┬────────────┬────┘
          click compatible│            │drag starts  │click non-target
          terminal        │            │             │ or Escape
                          ▼            ▼             ▼
               ADD_CONNECTION    DRAG ACTIVE     IDLE STATE
               → IDLE STATE      (see below)
                    
DRAG ACTIVE:
  ghostShape follows cursor
  previewLine updates each mousemove
  canvas dimming same as SELECTION ACTIVE
          │                      │
          │ release over          │ release over
          │ valid target          │ non-target / out-of-bounds
          ▼                      ▼
   ADD_CONNECTION            IDLE STATE (snap back)
   → IDLE STATE
```
