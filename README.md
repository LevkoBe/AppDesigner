# Application Designer - TypeScript Version

A visual application design tool built with TypeScript that allows you to create, connect, and manage different types of elements in a canvas-based interface.

## Project Structure

```
src/
├── types.ts                    # Type definitions and interfaces
├── models/
│   ├── Element.ts             # Element model class
│   └── Connection.ts          # Connection model class
├── state/
│   └── AppState.ts            # Application state management
├── ui/
│   ├── DOMManager.ts          # DOM manipulation and rendering
│   ├── ContextMenu.ts         # Context menu functionality
│   └── ViewControls.ts        # Zoom and pan controls
├── handlers/
│   └── EventHandlers.ts       # Event handling logic
├── utils/
│   └── ProjectManager.ts      # Save/load project functionality
├── App.ts                     # Main application class
└── main.ts                    # Application entry point
```

## Features

### Element Types

- **Collections**: Large container elements (120x80px)
- **Functions**: Medium processing elements (100x60px)
- **Objects**: Medium data elements (100x80px)
- **Input/Output**: Small I/O elements (80x40px)

### Interaction Modes

- **Create/Child Mode**: Create new elements or child elements
- **Connection Mode**: Connect elements together
- **Movement Mode**: Drag and move elements
- **Edit Mode**: Edit element properties

### Key Features

- Visual canvas-based design
- Drag and drop functionality
- Element connections with visual lines
- Context menu for element operations
- Project save/load functionality
- Zoom and pan controls
- Parent-child relationships
- Real-time visual feedback

## Setup and Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Development**

   ```bash
   npm run dev  # Watch mode compilation
   ```

3. **Build**

   ```bash
   npm run build
   ```

4. **Type Checking**
   ```bash
   npm run type-check
   ```

## Usage

### Creating Elements

1. Select the element type from the toolbar
2. Switch to "Create/Child Mode"
3. Click on the canvas to create a new element
4. Click on an existing element to create a child element
5. Hold Shift and click to delete elements

### Connecting Elements

1. Switch to "Connection Mode"
2. Click on the source element
3. Click on the target element to create a connection

### Moving Elements

1. Switch to "Movement Mode"
2. Click and drag elements to reposition them

### Editing Elements

1. Switch to "Edit Mode" and click on an element, OR
2. Double-click any element in any mode, OR
3. Right-click and select "Edit" from the context menu

### Project Management

- **Save**: Export your design as a JSON file
- **Load**: Import a previously saved JSON file
- **Clear**: Remove all elements from the canvas

## Architecture

### Core Classes

#### `Element`

- Represents individual design elements
- Handles positioning, sizing, and relationships
- Supports serialization for save/load

#### `Connection`

- Represents connections between elements
- Manages bidirectional relationships
- Handles visual rendering coordinates

#### `AppState`

- Centralized state management
- Tracks current mode, selected elements, and interactions
- Manages collections of elements and connections

#### `DOMManager`

- Handles all DOM manipulation
- Creates and updates visual representations
- Manages SVG connections and canvas rendering

#### `EventHandlers`

- Processes user interactions
- Coordinates between different modes
- Manages element creation, selection, and manipulation

## Type Safety

The application is built with strict TypeScript configuration:

- Strict null checks
- No implicit any
- Comprehensive type definitions
- Interface-based design patterns

## Browser Compatibility

- Modern browsers supporting ES2020
- DOM manipulation APIs
- SVG support for connections
- File API for project save/load

## Contributing

1. Follow the existing code structure
2. Add type definitions for new features
3. Update documentation for API changes
4. Ensure all TypeScript strict mode requirements are met

## License

MIT License - see LICENSE file for details
