/**
 * canvas-state.ts
 * Feature: 002-drag-connect-ux
 *
 * TypeScript interface contracts for the new visual state types introduced
 * by the Intuitive Module Connection UX feature.
 *
 * These types define the shape of data flowing between:
 *   ConfigStageContext  ↔  ModuleViewModel  ↔  ModuleView  ↔  TerminalShape
 *   ConfigStageContext  ↔  EvConfigCanvas.vue  ↔  EvModuleList.vue
 *
 * NO implementation here — this file is a design contract only.
 */

import type { ModuleInstanceID, Terminal, TerminalType } from "@/modules/evbc";

// ─── Terminal Visual State ────────────────────────────────────────────────────

/**
 * All possible visual rendering states for a single terminal icon.
 * The canvas rendering layer maps this to concrete Konva property values
 * (opacity, scale, SVG path data, fill color).
 */
export type TerminalVisualState =
  | "idle-unconnected"   // Default idle; no connections; role-specific icon, scale 1×
  | "idle-connected"     // Idle; ≥1 connection exists; connected icon, scale 1×
  | "selected"           // This terminal was clicked/dragged; role icon, scale 1.5×, full opacity
  | "compatible-target"  // Valid connection target for selected terminal; role icon, scale 1.5×
  | "dimmed-same-module" // Sibling terminal on same module as selected; opacity 0.25
  | "dimmed-incompatible"// Wrong type or interface; opacity 0.25
  | "dimmed-exhausted";  // Right type/interface but all pairs already connected to origin; opacity 0.25

// ─── Module Visual State ─────────────────────────────────────────────────────

/**
 * Coarse module-level opacity state derived from its constituent terminal states.
 */
export type ModuleVisualState =
  | "idle"           // No selection active; full opacity
  | "active"         // Owns the selected terminal; full opacity
  | "has-compatible" // Has ≥1 compatible-target terminal; full opacity
  | "dimmed";        // All terminals dimmed; module group opacity 0.35

// ─── Connection Visual State ─────────────────────────────────────────────────

export type ConnectionVisualState =
  | "idle"    // Full opacity, pointer-events enabled
  | "dimmed"; // Opacity 0.25

// ─── Extended Terminal Selection Event ───────────────────────────────────────

/**
 * Extended version of the TERMINAL selection event that carries
 * enough context for ModuleViewModels to compute compatibility without
 * needing to re-query the ConfigStageContext.
 *
 * Replaces / extends the existing TerminalSelection in stage_context.ts.
 */
export interface TerminalSelectionContext {
  readonly terminal: Terminal;
  readonly module_instance_id: ModuleInstanceID;
}

// ─── Modify Terminal Appearances Event ───────────────────────────────────────

/**
 * Event emitted from ModuleViewModel to ModuleView instructing it to
 * update each terminal's visual state.
 *
 * Replaces the existing TERMINAL_MODIFY_APPEARENCE event which only
 * supported three buckets (normal / disable / highlight).
 */
export interface ModifyTerminalStatesEvent {
  readonly type: "TERMINAL_MODIFY_STATES";
  /** terminal_id → TerminalVisualState for every terminal on this module */
  readonly states: Record<number, TerminalVisualState>;
}

// ─── Drag Preview Overlay ─────────────────────────────────────────────────────

/**
 * Configuration passed to DragPreviewOverlay when a terminal drag begins.
 */
export interface DragPreviewConfig {
  /** Absolute canvas position of the terminal icon centre (fixed for duration of drag) */
  readonly originPosition: { x: number; y: number };
  /** SVG path data to use for the ghost icon (matches the dragged terminal's icon) */
  readonly iconData: string;
  /** Fill color for the ghost icon */
  readonly iconFill: string;
  /** Terminal role — determines orientation at origin */
  readonly terminalType: TerminalType;
}

// ─── ConnectionManager Query Methods (new) ────────────────────────────────────

/**
 * Result of querying existing connections for a single terminal.
 * Returned by ConnectionManager.get_connections_for_terminal().
 */
export interface TerminalConnectionsResult {
  /** IDs of module instances that are connected to this terminal as the "other end" */
  readonly connected_instance_ids: ModuleInstanceID[];
  /** The terminal IDs (lookup IDs within each connected module view) of the connected endpoints */
  readonly connected_terminal_lookup_ids: number[];
}

/**
 * Query whether a specific provide↔requirement pair already has a connection.
 * Used during compatible-target evaluation to implement FR-006.
 */
export interface ConnectionPairQuery {
  readonly provide_module_instance_id: ModuleInstanceID;
  readonly provide_terminal_lookup_id: number;
  readonly requirement_module_instance_id: ModuleInstanceID;
  readonly requirement_terminal_lookup_id: number;
}

// ─── Left Panel Filter Contract ───────────────────────────────────────────────

/**
 * Prop passed from EvConfigCanvas.vue to EvModuleList.vue during terminal selection.
 * When non-null, EvModuleList shows only modules satisfying the filter.
 * When null, EvModuleList shows the full available module list (idle state).
 */
export interface LeftPanelTerminalFilter {
  readonly originType: TerminalType;
  readonly originInterface: string;
  readonly originInstanceId: ModuleInstanceID;
  /**
   * Set of module instance IDs that are already fully connected to the origin
   * (all their compatible terminals are exhausted) — these should be hidden
   * or greyed out in the left panel.
   */
  readonly exhausted_instance_ids: Set<ModuleInstanceID>;
}
