**Application Designer – Core Specification**

> **Live Demo**: https://levkobe.github.io/AppDesigner/

The **Application Designer** consists of a few main element types:

- **{Objects}**: Can represent a class, a system, or an argument.
- **[Collections]**: Represent categorizations such as state, phase, or any other classification.
- **(Functions)**: Represent actions, methods, or behaviors.
- **-Connections-**: Define relationships or flows between any of the above elements.
- **>Inputs/Outputs<**: Parameters that can be attached to any entity (object, collection, or function).
  **General Behavior**
- Entities can be **freely nested** within one another, regardless of type.
- **Left Mouse Click (LMC)** to select or create; **drag** to move elements.
  **Implementation Notes**
- **Language**: JavaScript
- **Architecture**: Clear separation between:
  - **Rendering logic**
  - **Data models**
  - **Input handling**
    **UI System**
- `[Collections]` → **Rectangles**
- `(Functions)` → **Ovals**
- `{Objects}` → **Polygons**
  **Input System**
- Multiple modes:
  - **Creation / Deletion**
  - **Connection / Disconnection**
  - **Movement**
    **Data Handling**
- All entities must be:
  - **Fully serializable**
  - **Fully deserializable**
    **Layout System**
- Use a **mock/manual layout** for now
- Plan for **force-directed layout** in the future
