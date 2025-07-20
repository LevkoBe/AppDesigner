### Issue: Cleanup on Project Switch

Some event listeners, DOM elements, or state (e.g. canvas, input layers) may persist across project switches, causing bugs or leaks.

Ensure full reset on switch:

- Delete all old listeners
- Reinit canvas + handlers
- Centralize teardown (e.g. resetEnvironment())

Tags: cleanup, refactor, project-switch

### Issue: Optimize Engine Updates

Currently, the engine may re-render unnecessarily even when there's no input or state change.

Optimize update loop:

- Skip rendering if no inputs/events
- Track state diffs or dirty flags
- Consider requestIdleCallback or frame throttling

Tags: performance, optimization, engine

### Issue: Minimal Syntax for Diagram Representation

**Description:**
Introduce a compact, textual syntax to describe diagrams consisting of classes, phases, objects, and method flows. This would enable easier debugging, sharing, and programmatic manipulation of diagrams.

**Example Representations:**

Option A (structure-focused):

```
A { x y z A(): a g() h() }
B { x y z B(b) f() }
P { f(a): c g(c): b }
```

Option B (flow-focused):

```
A { x y z A: 0->a g:0->0 h:0->0 g->A h->A }
B { x b B:b->0 f:0->0 b->f }
P { f:a->c g:c->b }
```

**Suggested Actions:**

- Define a minimal grammar or DSL for this structure.
- Allow import/export of diagrams using this syntax.
- Optionally enable diagram reconstruction from text input.

**Priority:** Low–Medium
**Tags:** enhancement, syntax, visualization, DSL

### Shift styling & accessibility

- Add description on Create/Delete button hovering
- Add description on Connect/Disconnect button hovering
- Change colors of buttons to red on Shift press
