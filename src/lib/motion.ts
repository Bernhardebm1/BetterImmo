import type { Transition } from "motion/react";

// Shared motion vocabulary so everything on the page moves the same way.
export const spring = {
  /** Default for layout changes and things entering. */
  soft: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } satisfies Transition,
  /** Small, snappy UI: chips, buttons, toggles. */
  snappy: { type: "spring", stiffness: 520, damping: 34 } satisfies Transition,
  /** Big surfaces: the detail sheet, hero to toolbar. */
  gentle: { type: "spring", stiffness: 180, damping: 28, mass: 1 } satisfies Transition,
};

export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
};
