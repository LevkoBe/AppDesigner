# Mermaid Diagrams: Connections & Elements Quick Reference

## Class Diagrams

### All Connection Types

```mermaid
classDiagram
    class A
    class B
    class C

    A --> B : association
    A o-- B : aggregation
    A *-- B : composition
    A <|-- B : inheritance
    A <|.. B : realization
    A ..> B : dependency
    C --> C : self-association
```

### Element Types

- **Class** — Blueprint with attributes/methods
- **Interface** — Contract defining methods
- **Abstract Class** — Non-instantiable class
- **Enumeration** — Fixed set of constants
- **Package** — Grouping mechanism
- **Data Type** — Primitive/user-defined types

### Connection Types

- **Association** — Basic structural connection
- **Aggregation** — Weak whole-part relationship
- **Composition** — Strong whole-part relationship
- **Inheritance** — "Is-a" relationship
- **Realization** — Interface implementation
- **Dependency** — Uses without ownership
- **Reflexive** — Self-referencing relationship

---

## State Diagrams

### All Connection Types

```mermaid
stateDiagram-v2
    [*] --> Idle : initial
    Idle --> Processing : eventTrigger
    Processing --> Waiting : conditional / guard
    Waiting --> Processing : retry / loop
    Processing --> Done : complete
    Done --> [*] : final

    state Processing {
        [*] --> Loading
        Loading --> Success
        Loading --> Error
    }
```

### Element Types

- **Initial state** — Entry point `[*]`
- **State** — Named system mode
- **Final state** — End point `[*]`
- **Composite state** — Contains substates
- **Transition** — Arrow between states

### Connection Types

- **Simple transition** — `A --> B`
- **Triggered transition** — `A --> B : onEvent`
- **Guarded transition** — `A --> B : [condition]`
- **Loop transition** — `A --> A`
- **Entry/Exit transitions** — Via nested states

---

## Sequence Diagrams

### All Connection Types

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend

    User->>Frontend: Request
    Frontend->>+Backend: Fetch data
    Backend-->>-Frontend: Response
    Frontend-->>User: Render

    alt valid input
        Backend->>Frontend: Success
    else invalid input
        Backend->>Frontend: Error
    end

    loop every 5s
        Frontend->>Backend: Poll
    end
```

### Element Types

- **Participant** — Actor/system in interaction
- **Message** — Communication between participants
- **Activation box** — Execution duration (`+`/`-`)
- **Note** — Annotations
- **Control blocks** — `alt`/`else`, `loop`, `par`, `opt`

### Connection Types

- **Synchronous call** — `A->>B: action`
- **Return message** — `B-->>A: result`
- **Self-call** — `A->>A: recurse`
- **Control constructs** — Conditional/loop logic

---

## Entity-Relationship Diagrams

### All Connection Types

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--|{ LINE_ITEM : referenced_by
    CUSTOMER }|..|| ADDRESS : has
    EMPLOYEE ||--o{ EMPLOYEE : manages
```

### Element Types

- **Entity** — Thing with distinct existence
- **Relationship** — Connection between entities
- **Associative Entity** — Junction with own attributes

### Connection Types

- **One-to-One** — `}|..||`
- **One-to-Many (optional)** — `||--o{`
- **One-to-Many (mandatory)** — `||--|{`
- **Many-to-Many** — Via associative entities
- **Recursive** — Self-referencing relationships

---

## Flowcharts

### All Connection Types

```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[Alternative]
    C --> E((Event))
    D --> E
    E -.-> F[Optional Step]
    F ==> G[Important Process]
    G --> H[End]

    %% Subgraph connections
    subgraph S1[Subprocess]
        I[Step 1] --> J[Step 2]
    end
    C --> S1
    S1 --> G
```

### Element Types

- **Process** — Rectangle `[text]`
- **Decision** — Diamond `{text}`
- **Start/End** — Rounded rectangle `([text])`
- **Event** — Circle `((text))`
- **Subgraph** — Container for grouped nodes
- **Database** — Cylinder `[(text)]`
- **Subroutine** — Double rectangle `[[text]]`

### Connection Types

- **Solid arrow** — `-->`
- **Labeled arrow** — `-->|label|`
- **Dotted arrow** — `-.->` (optional/conditional)
- **Thick arrow** — `==>` (emphasis)
- **Bi-directional** — `<-->`
- **No arrow** — `---` (association only)

---

## Gitgraph (Git Flow)

### All Connection Types

```mermaid
gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature A"
    branch feature/login
    checkout feature/login
    commit id: "Login UI"
    commit id: "Login Logic"
    checkout develop
    merge feature/login
    commit id: "Integration"
    checkout main
    merge develop
    commit id: "Release 1.0"
```

### Element Types

- **Commit** — Point in version history
- **Branch** — Parallel development line
- **Main/Master** — Primary branch
- **Feature branch** — Topic-specific branch
- **Tag** — Named reference point

### Connection Types

- **Commit** — Sequential development
- **Branch** — Divergent development path
- **Merge** — Combining branches
- **Checkout** — Switch active branch
- **Cherry-pick** — Copy specific commit

---

## User Journey

### All Connection Types

```mermaid
journey
    title User Shopping Experience
    section Discovery
      Visit homepage: 5: User
      Browse products: 4: User
      Search items: 3: User, System
    section Purchase
      Add to cart: 5: User
      Checkout: 2: User, System
      Payment: 1: User, Payment Gateway
    section Post-purchase
      Confirmation: 5: User, System
      Shipping: 3: User, Logistics
      Review: 4: User
```

### Element Types

- **Journey** — Overall user experience
- **Section** — Phase of the journey
- **Task** — Specific user action
- **Actor** — User, System, or external service
- **Score** — Satisfaction rating (1-5)

### Connection Types

- **Sequential flow** — Tasks follow chronological order
- **Actor involvement** — Multiple actors per task
- **Satisfaction mapping** — Emotional journey tracking
- **Phase transitions** — Section boundaries

---

## Mindmaps

### All Connection Types

```mermaid
mindmap
  root((Project))
    Planning
      Requirements
        Functional
        Non-functional
      Timeline
      Resources
    Development
      Frontend
        React
        CSS
      Backend
        API
        Database
    Testing
      Unit Tests
      Integration
      E2E
    Deployment
      Staging
      Production
```

### Element Types

- **Root** — Central topic `((text))`
- **Branch** — Main category
- **Sub-branch** — Nested topic
- **Leaf** — Terminal node
- **Node** — Any point in hierarchy

### Connection Types

- **Hierarchical** — Parent-child relationships
- **Radial** — Branches from center
- **Nested** — Multiple levels deep
- **Associative** — Conceptual grouping

---

## C4 Context Diagrams

### All Connection Types

```mermaid
C4Context
    title System Context for Banking App

    Person(customer, "Customer", "Banking customer")
    System(banking, "Banking System", "Core banking platform")
    System_Ext(email, "Email System", "External email service")
    System_Ext(audit, "Audit System", "Compliance logging")

    Rel(customer, banking, "Uses", "HTTPS")
    Rel(banking, email, "Sends emails", "SMTP")
    Rel(banking, audit, "Logs to", "TCP")

    UpdateRelStyle(customer, banking, $offsetX="-50", $offsetY="-20")
```

### Element Types

- **Person** — Human user
- **System** — Internal software system
- **System_Ext** — External system
- **Container** — Deployable unit
- **Component** — Code component
- **Boundary** — System/container boundary

### Connection Types

- **Rel** — General relationship
- **BiRel** — Bi-directional relationship
- **Rel_U/D/L/R** — Directional relationships
- **UpdateRelStyle** — Styling adjustments
- **System boundaries** — Logical grouping
