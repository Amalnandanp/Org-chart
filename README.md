# Angular Organizational Chart

A fully-featured organizational chart component for Angular with interactive features including node collapse, zoom, drag, and more.

## Features

✅ **Node Collapse/Expand** - Click on any node to toggle its children
✅ **Zoom In/Out** - Use toolbar buttons or mouse wheel to zoom
✅ **Pan/Drag** - Drag the canvas to pan around the org chart
✅ **Expand/Collapse All** - Toolbar buttons to expand or collapse all nodes
✅ **Children Count** - Blue badge on each node displays the number of children
✅ **Smooth Animations** - Animated transitions for expand/collapse actions
✅ **Responsive Design** - Works on different screen sizes
✅ **Fit to Screen** - Auto-fit the entire chart to the visible area

## Project Structure

```
org-chart-app/
├── src/
│   ├── app/
│   │   ├── org-chart/
│   │   │   ├── org-chart.component.ts      # Main component logic
│   │   │   ├── org-chart.component.html    # Template with toolbar
│   │   │   └── org-chart.component.scss    # Styling
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   └── app.module.ts
│   └── styles.scss
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- Angular CLI (v12.2.0)

### Installation

1. Navigate to the project directory:
   ```bash
   cd org-chart-app
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   or
   ```bash
   ng serve --port 4201
   ```

4. Open your browser and navigate to `http://localhost:4201`

## Usage

### Basic Controls

- **Click on a node** - Expand or collapse its children
- **Drag** - Click and drag anywhere on the canvas to pan
- **Mouse wheel** - Scroll to zoom in/out
- **Toolbar buttons** - Use the toolbar for quick actions

### Customizing the Data

To customize the organizational chart with your own data, modify the `orgData` object in `src/app/org-chart/org-chart.component.ts`:

```typescript
private orgData: OrgNode = {
  id: '1',
  name: 'CEO Name',
  title: 'Chief Executive Officer',
  children: [
    {
      id: '2',
      name: 'Employee Name',
      title: 'Job Title',
      children: [
        // Add more nested employees
      ]
    }
  ]
};
```

### Data Structure

```typescript
interface OrgNode {
  id: string;           // Unique identifier
  name: string;         // Employee name
  title: string;        // Job title
  children?: OrgNode[]; // Array of subordinates
}
```

### Using the Component in Your App

1. Import the component in your module:
   ```typescript
   import { OrgChartComponent } from './org-chart/org-chart.component';

   @NgModule({
     declarations: [OrgChartComponent],
     // ...
   })
   ```

2. Use it in your template:
   ```html
   <app-org-chart></app-org-chart>
   ```

### Public API Methods

The component exposes several public methods that you can call programmatically:

```typescript
// Expand all nodes
orgChartComponent.expandAll();

// Collapse all nodes except root
orgChartComponent.collapseAll();

// Zoom in
orgChartComponent.zoomIn();

// Zoom out
orgChartComponent.zoomOut();

// Reset zoom to default
orgChartComponent.resetZoom();

// Fit chart to screen
orgChartComponent.fitToScreen();

// Update chart with new data
orgChartComponent.updateOrgData(newOrgData);
```

## Customization

### Styling

Modify the colors and styles in `src/app/org-chart/org-chart.component.scss`:

```scss
// Node colors
.node rect {
  fill: #fff;
  stroke: #4a90e2;
}

// Background color
.org-chart-container {
  background-color: #f0f2f5;
}

// Button styles
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Node Dimensions

Adjust node size in the component:

```typescript
private nodeWidth = 180;
private nodeHeight = 80;
```

### Animation Speed

Change animation duration:

```typescript
private duration = 750; // milliseconds
```

## Technologies Used

- **Angular 12** - Frontend framework
- **D3.js v6.7** - Data visualization library
- **TypeScript** - Programming language
- **SCSS** - Styling

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance

- Handles hierarchies with hundreds of nodes
- Smooth animations at 60fps
- Efficient DOM updates using D3's data join

## Troubleshooting

### Chart not appearing
- Check browser console for errors
- Ensure D3.js is properly installed
- Verify component is properly declared in module

### Zoom/Pan not working
- Make sure D3 zoom behavior is initialized
- Check that SVG element has proper dimensions

### Children count not showing
- Verify data structure includes children array
- Check that nodes have proper IDs

## Future Enhancements

Potential features to add:
- Search functionality
- Export to PNG/SVG
- Vertical orientation option
- Custom node templates
- Tooltips with more information
- Integration with backend API
- Multi-select nodes
- Keyboard navigation

## License

MIT License - feel free to use in your projects!

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created with ❤️ for organizational visualization needs
