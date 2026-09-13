# FLUX — Intelligent Creative Layout Engine

FLUX is an advanced, deterministic layout engine for multi-surface interactive creative content.

## What is FLUX?
FLUX is a prototype that demonstrates how to adapt a single complex creative composition across diverse display surfaces (e.g., Desktop 16:9, Mobile 9:16, Square 1:1) without relying on basic CSS media queries. Instead, it uses a real-time constraint resolution engine that considers element priorities, minimum dimensions, collision spaces, and safe zones.

## Why is this problem difficult?
Adapting interactive ad creatives isn't just about scaling elements down. It involves:
- Maintaining strict visual hierarchy (Headline > Product > Decorative)
- Preventing overlapping interactive touch targets (e.g., CTA and Hotspots)
- Keeping critical information within safe zones for varying display bezels
- Relayouting elements semantically (e.g., stacking on mobile instead of just shrinking)

CSS is fundamentally declarative and unaware of dynamic layout health scores. FLUX introduces an algorithmic approach to layout.

## Architecture

```text
src/
├── engine/                # Core pure-function layout logic (No React)
│   ├── layoutEngine.ts    # Main constraint resolver
│   ├── collision.ts       # AABB collision detection & resolution
│   ├── scoring.ts         # Layout health evaluation
│   └── types.ts           # Strict data models
├── store/                 # Global Zustand state
│   └── store.ts           # Ties engine to UI state
└── components/            # React UI layer
    ├── Editor.tsx         # Main creative workspace
    ├── Canvas.tsx         # Render engine outputs
    ├── Inspector.tsx      # Diagnostic tools & Decision Traces
    ├── EngineLab.tsx      # Constraint weight tuning
    └── StressTest.tsx     # Automated testing suite
```

## Layout Engine Design
The layout engine operates sequentially on each layout pass:
1. **Priority Sorting**: Elements are processed highest-priority first.
2. **Dimension Constraints**: Large elements shrink based on viewport capacity.
3. **Repositioning & Safe Zones**: Elements flow according to `preferredZones` and are constrained to `SAFE_ZONE_PADDING`.
4. **Collision Resolution**: Bounding box intersections trigger repulsions or hide low-priority elements entirely.
5. **Scoring**: A mathematical score (0-100) is calculated based on penalty weights.

## Constraint Resolution
Constraints are deterministic. They rely on predefined behavior flags (`shrink`, `reposition`, `stack`, `hide`). Mobile viewports force a sequential stack flow for critical elements, while Desktop uses spatial repositioning.

## Collision Detection
Uses strict Axis-Aligned Bounding Box (AABB) intersection testing. Overlaps generate penalty scores relative to the `overlapArea` size.

## Safe Zones
Padding values vary per surface (e.g., Mobile uses 24px, Desktop uses 60px). Text readability and CTA placements are strictly verified against these boundaries.

## Layout Scoring & Decision Trace
The Engine Lab exposes internal metrics. The **Decision Trace** feature reveals exactly *why* an element moved (e.g., "Available width decreased -> SHRINK to 300x150" or "Unresolvable collision -> HIDE"). 

## Stress Testing
The Stress Test automates layout calculations across 8 heterogeneous screen sizes, generating aggregate health metrics without rendering DOM nodes. It's a pure computational test of the `layoutEngine.ts`.

## Performance Considerations
- The engine uses pure JS mathematical operations (no DOM measurement forcing reflows).
- Zustand is used with selectors to prevent global React re-renders.
- Framer Motion handles visual transitions independently.

## Trade-offs
- The collision resolver currently uses a basic "push down" strategy rather than a full 2D bin-packing or force-directed graph to maintain deterministic execution speeds.
- Visuals are CSS-based approximations of complex creative assets to avoid fragile external image dependencies.

## Why Deterministic Rules Instead of AI?
While LLMs and Neural Networks are powerful, using them for real-time layout rendering inside a browser is too slow, non-deterministic (leads to jittering), and computationally expensive. FLUX demonstrates a robust algorithmic foundation. Future AI integration could dynamically adjust the *weights* in the Engine Lab based on learned conversion metrics, rather than drawing the layout directly.

## Local Development
```bash
npm install
npm run dev
```

## Deployment
This project is built with Vite and can be deployed directly to Vercel or any static host using:
```bash
npm run build
```

## Relevance to Flam
FLUX models the exact frontend infrastructure necessary for companies like Flam to scale generative or 3D interactive assets. By decoupling the *creative content* from the *surface constraints*, Flam can render ads anywhere without manual designer intervention per format.
