import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  employeeCode?: string;
  children?: OrgNode[];
  _children?: OrgNode[];
  collapsed?: boolean;
  // Custom fields for card template
  avatar?: string;
  email?: string;
  phone?: string;
  department?: string;
  customData?: any;
  hideSiblings?: boolean;
  _hiddenSiblings?: OrgNode[]; // Store hidden siblings for restoration
  // gridColumns is now global, but we can keep this for optional override if needed
  gridColumns?: number;
  _gridRemainder?: any[]; // Store remaining children for grid layout
}

@Component({
  selector: 'app-org-chart',
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.scss']
})
export class OrgChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chart', { static: false }) private chartContainer!: ElementRef;

  private svg: any;
  private g: any;
  private tree: any;
  private root: any;
  private zoom: any;
  private width = 1200;
  private height = 1000;
  private duration = 750;
  private nodeWidth = 180;
  private nodeHeight = 80;
  private customCardWidth = 220;
  private customCardHeight = 140;
  private chartPadding = 50; // Padding for fit to screen and zoom to results
  public siblingGapPx = 20; // Horizontal gap between sibling nodes in pixels (min: 0, max: 100)
  public cousinGapPx = 40; // Horizontal gap between cousin nodes in pixels (min: 0, max: 100)
  public levelGapPx = 100; // Vertical distance between hierarchy levels in pixels (min: 50, max: 200)
  public gridColumns = 9; // Number of columns for grid layout (min: 1, max: 10)
  public useGridLayout = false; // Toggle to enable/disable grid layout feature
  public linkStyle: 'curved' | 'straight' = 'straight'; // Toggle between curved and 90deg bend
  public orientation: 'vertical' | 'horizontal' = 'vertical'; // Toggle between vertical and horizontal layout
  public useCustomCard = false; // Toggle between default and custom card
  public searchKeyword = ''; // Search keyword
  public showNoResults = false; // Show no results message
  public showAddNodeDialog = false;
  public selectedNode: any = null;
  public newNodeName = '';
  public newNodeTitle = '';

  // Sample org data - you can replace this with your actual data
  private orgData: OrgNode = {
    id: '1',
    name: 'John Doe',
    title: 'CEO',
    employeeCode: 'EMP001',
    avatar: 'https://i.pravatar.cc/150?img=12',
    email: 'john.doe@company.com',
    phone: '+1 234 567 8900',
    department: 'Executive',
    children: [
      {
        id: '2',
        name: 'Jane Smith',
        title: 'CTO',
        employeeCode: 'EMP002',
        avatar: 'https://i.pravatar.cc/150?img=5',
        email: 'jane.smith@company.com',
        phone: '+1 234 567 8901',
        department: 'Technology',
        hideSiblings: true,
        children: [
          {
            id: '4',
            name: 'Bob Wilson',
            title: 'Engineering Manager',
            employeeCode: 'EMP004',
            avatar: 'https://i.pravatar.cc/150?img=13',
            email: 'bob.wilson@company.com',
            department: 'Engineering',
            hideSiblings: true,
            children: [
              { id: '7', name: 'Alice Brown', title: 'Senior Developer', employeeCode: 'EMP007', avatar: 'https://i.pravatar.cc/150?img=1', department: 'Engineering' },
              { id: '8', name: 'Charlie Davis', title: 'Developer', employeeCode: 'EMP008', avatar: 'https://i.pravatar.cc/150?img=8', department: 'Engineering' },
              { id: '9', name: 'Diana Evans', title: 'Junior Developer', employeeCode: 'EMP009', avatar: 'https://i.pravatar.cc/150?img=9', department: 'Engineering' },
              { id: '14', name: 'Liam Wilson', title: 'Developer', employeeCode: 'EMP014', avatar: 'https://i.pravatar.cc/150?img=16', department: 'Engineering', hideSiblings: true },
              { id: '15', name: 'Noah Martinez', title: 'Developer', employeeCode: 'EMP015', avatar: 'https://i.pravatar.cc/150?img=17', department: 'Engineering' },
              { id: '16', name: 'Olivia Anderson', title: 'Developer', employeeCode: 'EMP016', avatar: 'https://i.pravatar.cc/150?img=18', department: 'Engineering' },
              { id: '17', name: 'William Thomas', title: 'Developer', employeeCode: 'EMP017', avatar: 'https://i.pravatar.cc/150?img=19', department: 'Engineering' },
              { id: '18', name: 'James Taylor', title: 'Developer', employeeCode: 'EMP018', avatar: 'https://i.pravatar.cc/150?img=20', department: 'Engineering' },
              { id: '19', name: 'Benjamin Moore', title: 'Developer', employeeCode: 'EMP019', avatar: 'https://i.pravatar.cc/150?img=21', department: 'Engineering' },
              { id: '20', name: 'Lucas Jackson', title: 'Developer', employeeCode: 'EMP020', avatar: 'https://i.pravatar.cc/150?img=22', department: 'Engineering' },
              { id: '21', name: 'Henry White', title: 'Developer', employeeCode: 'EMP021', avatar: 'https://i.pravatar.cc/150?img=23', department: 'Engineering' },
              { id: '22', name: 'Alexander Harris', title: 'Developer', employeeCode: 'EMP022', avatar: 'https://i.pravatar.cc/150?img=24', department: 'Engineering' },
              { id: '23', name: 'Mason Martin', title: 'Developer', employeeCode: 'EMP023', avatar: 'https://i.pravatar.cc/150?img=25', department: 'Engineering' },
              { id: '24', name: 'Michael Thompson', title: 'Developer', employeeCode: 'EMP024', avatar: 'https://i.pravatar.cc/150?img=26', department: 'Engineering' },
              { id: '25', name: 'Ethan Garcia', title: 'Developer', employeeCode: 'EMP025', avatar: 'https://i.pravatar.cc/150?img=27', department: 'Engineering' },
              { id: '26', name: 'Daniel Martinez', title: 'Developer', employeeCode: 'EMP026', avatar: 'https://i.pravatar.cc/150?img=28', department: 'Engineering' },
              { id: '27', name: 'Matthew Robinson', title: 'Developer', employeeCode: 'EMP027', avatar: 'https://i.pravatar.cc/150?img=29', department: 'Engineering' },
              { id: '28', name: 'Joseph Clark', title: 'Developer', employeeCode: 'EMP028', avatar: 'https://i.pravatar.cc/150?img=30', department: 'Engineering' }
            ]
          },
          {
            id: '5',
            name: 'Emma Johnson',
            title: 'QA Manager',
            employeeCode: 'EMP005',
            avatar: 'https://i.pravatar.cc/150?img=10',
            email: 'emma.johnson@company.com',
            department: 'Quality Assurance',
            children: [
              {
                id: '10',
                name: 'Frank Green',
                title: 'QA Engineer',
                employeeCode: 'EMP010',
                avatar: 'https://i.pravatar.cc/150?img=11',
                department: 'Quality Assurance',
                children: [
                  { id: '29', name: 'Sophia Wilson', title: 'Junior QA Tester', employeeCode: 'EMP029', avatar: 'https://i.pravatar.cc/150?img=31', department: 'Quality Assurance' },
                  { id: '30', name: 'Jackson Brown', title: 'Junior QA Tester', employeeCode: 'EMP030', avatar: 'https://i.pravatar.cc/150?img=32', department: 'Quality Assurance' },
                  { id: '31', name: 'Ava Davis', title: 'Junior QA Tester', employeeCode: 'EMP031', avatar: 'https://i.pravatar.cc/150?img=33', department: 'Quality Assurance' },
                  { id: '32', name: 'Logan Miller', title: 'Test Automation Engineer', employeeCode: 'EMP032', avatar: 'https://i.pravatar.cc/150?img=34', department: 'Quality Assurance' },
                  { id: '33', name: 'Mia Garcia', title: 'Test Automation Engineer', employeeCode: 'EMP033', avatar: 'https://i.pravatar.cc/150?img=35', department: 'Quality Assurance' },
                  { id: '34', name: 'Aiden Martinez', title: 'Senior QA Tester', employeeCode: 'EMP034', avatar: 'https://i.pravatar.cc/150?img=36', department: 'Quality Assurance' },
                  { id: '35', name: 'Charlotte Rodriguez', title: 'Senior QA Tester', employeeCode: 'EMP035', avatar: 'https://i.pravatar.cc/150?img=37', department: 'Quality Assurance' },
                  { id: '36', name: 'Elijah Anderson', title: 'QA Analyst', employeeCode: 'EMP036', avatar: 'https://i.pravatar.cc/150?img=38', department: 'Quality Assurance' },
                  { id: '37', name: 'Amelia Thomas', title: 'QA Analyst', employeeCode: 'EMP037', avatar: 'https://i.pravatar.cc/150?img=39', department: 'Quality Assurance' },
                  { id: '38', name: 'Sebastian Lee', title: 'Performance Tester', employeeCode: 'EMP038', avatar: 'https://i.pravatar.cc/150?img=40', department: 'Quality Assurance' }
                ]
              },
              { id: '11', name: 'Grace Harris', title: 'QA Engineer', employeeCode: 'EMP011', avatar: 'https://i.pravatar.cc/150?img=3', department: 'Quality Assurance' }
            ]
          }
        ]
      },
      {
        id: '3',
        name: 'Mike Taylor',
        title: 'CFO',
        employeeCode: 'EMP003',
        avatar: 'https://i.pravatar.cc/150?img=14',
        email: 'mike.taylor@company.com',
        phone: '+1 234 567 8902',
        department: 'Finance',
        children: [
          {
            id: '6',
            name: 'Sarah Miller',
            title: 'Accounting Manager',
            employeeCode: 'EMP006',
            avatar: 'https://i.pravatar.cc/150?img=4',
            email: 'sarah.miller@company.com',
            department: 'Accounting',
            children: [
              { id: '12', name: 'Henry Clark', title: 'Accountant', employeeCode: 'EMP012', avatar: 'https://i.pravatar.cc/150?img=15', department: 'Accounting' },
              { id: '13', name: 'Ivy Lewis', title: 'Accountant', employeeCode: 'EMP013', avatar: 'https://i.pravatar.cc/150?img=2', department: 'Accounting' }
            ]
          }
        ]
      }
    ]
  };

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.createChart();
    // Fit to screen after initial render
    setTimeout(() => this.fitToScreen(), 100);
  }

  private createChart(): void {
    const element = this.chartContainer.nativeElement;

    // Clear any existing chart
    d3.select(element).selectAll('*').remove();

    // Create SVG
    this.svg = d3.select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.height)
      .style('background-color', '#f8f9fa');

    // Add zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create group element
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.width / 2}, 50)`);

    // Create tree layout with dynamic node spacing based on card dimensions
    // We use the sibling gap to define the base "node size" for the tree layout
    const nodeWidth = this.useCustomCard ? this.customCardWidth : this.nodeWidth;
    const nodeHeight = this.useCustomCard ? this.customCardHeight : this.nodeHeight;

    // In vertical mode, siblings are arranged horizontally (use width)
    // In horizontal mode, siblings are arranged vertically (use height)
    // Note: We swap X/Y later for horizontal mode, so D3's "x" (sibling axis)
    // effectively becomes the Y axis in horizontal mode.
    const isVertical = this.orientation === 'vertical';
    const siblingDimension = isVertical ? nodeWidth : nodeHeight;

    // The first dimension of nodeSize is the spacing between siblings
    const nodeSize: [number, number] = [siblingDimension + this.siblingGapPx, isVertical ? nodeHeight : nodeWidth];

    this.tree = d3.tree()
      .nodeSize(nodeSize)
      .separation((a: any, b: any) => {
        // If siblings, return 1 (standard nodeSize distance)
        // If cousins, calculate ratio needed to achieve cousinGapPx
        // Ratio = (Dimension + CousinGap) / (Dimension + SiblingGap)
        return a.parent === b.parent ? 1 : (siblingDimension + this.cousinGapPx) / (siblingDimension + this.siblingGapPx);
      });

    // Process data
    this.root = d3.hierarchy(this.orgData);
    this.root.x0 = 0;
    this.root.y0 = 0;

    // Initialize all nodes as expanded
    this.root.descendants().forEach((d: any) => {
      d._children = d.children;
    });

    // Apply hide siblings logic initially
    this.applyHideSiblingsLogic(this.root);

    this.update(this.root);
  }

  private update(source: any): void {
    // If showing no results, don't update the chart but still allow the no results message to show
    if (this.showNoResults) {
      return;
    }

    // 1. Prepare Grid Layout (Hide extra children from D3 to trick layout engine)
    this.prepareGridLayout(this.root);

    const treeData = this.tree(this.root);

    // 2. Inject Grid Nodes (Add them back with manual coordinates)
    this.injectGridNodes(this.root);

    const nodes = treeData.descendants();
    const links = treeData.links();

    // Normalize for fixed-depth - use pixel-based level depth
    // We calculate the absolute position based on the node dimension + gap
    // This ensures levelGapPx represents the actual empty space between levels
    const isVertical = this.orientation === 'vertical';
    const nodeWidth = this.useCustomCard ? this.customCardWidth : this.nodeWidth;
    const nodeHeight = this.useCustomCard ? this.customCardHeight : this.nodeHeight;
    const levelDimension = isVertical ? nodeHeight : nodeWidth;

    nodes.forEach((d: any) => {
      // Only apply depth-based Y if it's NOT a grid node (grid nodes have manual Y)
      // Actually, injectGridNodes sets Y relative to parent.
      // But standard D3 nodes need this.
      // Let's check if we should skip grid nodes.
      // The grid nodes are already positioned by injectGridNodes.
      // But wait, injectGridNodes runs BEFORE this loop.
      // So this loop will overwrite grid node Ys!

      // We should ONLY update Y for non-grid nodes.
      // Or, we should run injectGridNodes AFTER this loop?
      // But injectGridNodes needs the parent's final position.

      // Strategy:
      // 1. Run this depth loop for ALL nodes first (sets baseline Y).
      // 2. THEN run injectGridNodes to override grid children positions.

      d.y = d.depth * (levelDimension + this.levelGapPx);
    });

    // Re-run injectGridNodes to overwrite positions with correct parent coordinates
    // We need to run it here because we need the parent's final (depth-based) Y.
    this.injectGridNodes(this.root);

    // Swap x and y for horizontal orientation
    if (this.orientation === 'horizontal') {
      nodes.forEach((d: any) => {
        const temp = d.x;
        d.x = d.y;
        d.y = temp;
      });
    }

    // ****************** Nodes section ***************************

    // Update the nodes
    const node = this.g.selectAll('g.node')
      .data(nodes, (d: any) => d.data.id);

    // Enter any new nodes at the parent's previous position
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', () => `translate(${source.x0},${source.y0})`)
      .style('cursor', 'pointer');

    // Render card based on custom/default mode
    if (this.useCustomCard) {
      this.renderCustomCard(nodeEnter);
    } else {
      this.renderDefaultCard(nodeEnter);
    }

    // Add click event to toggle children
    nodeEnter.on('click', (_event: any, d: any) => {
      this.toggleNode(d);
    });

    // Add right-click event to add child node
    nodeEnter.on('contextmenu', (event: any, d: any) => {
      event.preventDefault();
      this.openAddNodeDialog(d);
    });

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(this.duration)
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .on('end', () => {
        // Fit to screen after transition completes
        if (nodeUpdate.size() === nodes.length) {
          setTimeout(() => this.fitToScreen(), 50);
        }
      });

    // Apply search filter opacity
    nodeUpdate
      .style('opacity', (d: any) => {
        // If no search term, show all nodes with full opacity
        if (!this.searchKeyword || this.searchKeyword.trim() === '') {
          return 1;
        }
        // Otherwise, apply opacity based on match
        return this.matchesSearch(d.data) ? 1 : 0.3;
      });

    // Update the node attributes and style
    nodeUpdate.select('rect')
      .style('fill', '#fff');

    nodeUpdate.select('.children-count')
      .style('fill', (d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? '#4a90e2' : 'none';
      })
      .style('display', (d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? 'block' : 'none';
      });

    nodeUpdate.select('.children-count-text')
      .text((d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? childrenCount : '';
      });

    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
      .duration(this.duration)
      .attr('transform', () => `translate(${source.x},${source.y})`)
      .remove();

    nodeExit.select('rect')
      .style('opacity', 0);

    nodeExit.select('text')
      .style('opacity', 0);

    // ****************** Links section ***************************

    // Update the links
    const link = this.g.selectAll('path.link')
      .data(links, (d: any) => d.target.data.id);

    // Enter any new links at the parent's previous position
    const linkEnter = link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', () => {
        const o = { x: source.x0, y: source.y0 };
        return this.diagonal(o, o);
      })
      .style('fill', 'none')
      .style('stroke', '#ccc')
      .style('stroke-width', '2px');

    // UPDATE
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(this.duration)
      .attr('d', (d: any) => this.diagonal(d.source, d.target));

    // Remove any exiting links
    link.exit().transition()
      .duration(this.duration)
      .attr('d', () => {
        const o = { x: source.x, y: source.y };
        return this.diagonal(o, o);
      })
      .remove();

    // Store the old positions for transition
    nodes.forEach((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  private diagonal(s: any, d: any): string {
    if (this.orientation === 'horizontal') {
      // Horizontal orientation: connect right side of parent to left side of child
      if (this.linkStyle === 'straight') {
        // 90-degree bend for horizontal layout
        return `M ${s.x} ${s.y}
                H ${(s.x + d.x) / 2}
                V ${d.y}
                H ${d.x}`;
      } else {
        // Curved path for horizontal layout
        return `M ${s.x} ${s.y}
                C ${(s.x + d.x) / 2} ${s.y},
                  ${(s.x + d.x) / 2} ${d.y},
                  ${d.x} ${d.y}`;
      }
    } else {
      // Vertical orientation: connect bottom of parent to top of child
      if (d.data && d.data.isGridNode) {
        // Custom path for grid nodes - "Column Gutter" Style
        // Path: Parent Bottom -> Bus Y -> Horizontal to Gutter X -> Vertical to Child Y -> Horizontal to Child Left

        const cardWidth = this.useCustomCard ? this.customCardWidth : this.nodeWidth;
        const cardHeight = this.useCustomCard ? this.customCardHeight : this.nodeHeight;

        const parentBottomY = s.y + (cardHeight / 2);
        const childLeftX = d.x - (cardWidth / 2);

        // Bus Y: 20px below parent
        const busY = parentBottomY + 20;

        // Gutter X: 15px to the left of the card
        const gutterX = childLeftX - 15;

        // Path construction
        return `M ${s.x} ${parentBottomY}
                V ${busY}
                H ${gutterX}
                V ${d.y}
                H ${childLeftX}`;
      }

      if (this.linkStyle === 'straight') {
        // 90-degree bend for vertical layout
        return `M ${s.x} ${s.y}
                V ${(s.y + d.y) / 2}
                H ${d.x}
                V ${d.y}`;
      } else {
        // Curved path for vertical layout
        return `M ${s.x} ${s.y}
                C ${s.x} ${(s.y + d.y) / 2},
                  ${d.x} ${(s.y + d.y) / 2},
                  ${d.x} ${d.y}`;
      }
    }
  }

  // Prepare grid layout by hiding extra children from D3
  private prepareGridLayout(node: any): void {
    // Restore any previously hidden grid remainder to ensure we start fresh
    if (node._gridRemainder) {
      if (node.children) {
        node.children = node.children.concat(node._gridRemainder);
      } else {
        node.children = node._gridRemainder;
      }
      node._gridRemainder = null;
    }

    // Check if this node uses grid layout
    // Auto-activate grid if children count exceeds column count OR if explicitly set
    // But only if the global useGridLayout flag is enabled
    const columns = node.data.gridColumns || this.gridColumns;
    const shouldGrid = this.useGridLayout && (node.data.gridColumns || (node.children && node.children.length > columns));

    if (shouldGrid && node.children && node.children.length > columns) {
      // Keep only the first 'columns' children for D3 layout
      // This makes D3 calculate the parent's width based on just one row
      node._gridRemainder = node.children.slice(columns);
      node.children = node.children.slice(0, columns);
    }

    // Recurse
    if (node.children) {
      node.children.forEach((child: any) => this.prepareGridLayout(child));
    }
  }

  // Inject grid nodes back into the tree with manual positions
  private injectGridNodes(node: any): void {
    const columns = node.data.gridColumns || this.gridColumns;
    // Check if we should apply grid logic (same condition as prepareGridLayout)
    // Note: node.children might be truncated now, so we check _gridRemainder too
    // But only if the global useGridLayout flag is enabled
    const hasRemainder = !!node._gridRemainder;
    const shouldGrid = this.useGridLayout && (node.data.gridColumns || hasRemainder || (node.children && node.children.length > columns));

    if (shouldGrid && (node.children || node._gridRemainder)) {
      // Combine all children (visible + remainder)
      let allChildren = node.children || [];
      if (node._gridRemainder) {
        allChildren = allChildren.concat(node._gridRemainder);
        // Restore full children array to the node so descendants() finds them
        node.children = allChildren;
        node._gridRemainder = null; // Clear remainder as they are now in children
      }

      if (allChildren.length > 0) {
        const nodeWidth = this.useCustomCard ? this.customCardWidth : this.nodeWidth;
        const nodeHeight = this.useCustomCard ? this.customCardHeight : this.nodeHeight;
        const itemWidth = nodeWidth + this.siblingGapPx;
        const itemHeight = nodeHeight + this.levelGapPx;

        // Calculate starting X to center the grid under the parent
        // We want the grid to be centered on the parent's X
        const totalGridWidth = Math.min(allChildren.length, columns) * itemWidth;
        // The start X is parent.x minus half grid width, plus half item width (to center first item)
        // Wait, D3 centers the parent over the children.
        // Since we tricked D3 with the first row, the parent.x should already be centered over the first row!
        // So we can just use the X of the first child as the reference for the first column?
        // Yes, but we want to enforce strict grid spacing.

        // Let's calculate strict positions based on parent.x
        const startX = node.x - (totalGridWidth / 2) + (itemWidth / 2);
        const startY = node.y + itemHeight; // One level down

        allChildren.forEach((child: any, index: number) => {
          const col = index % columns;
          const row = Math.floor(index / columns);

          child.x = startX + (col * itemWidth) - (this.siblingGapPx / 2); // Adjust for gap centering?
          // Actually: startX is center of first item.
          // col * itemWidth adds width.
          // Let's verify:
          // If 1 item: width = itemWidth. startX = node.x - itemWidth/2 + itemWidth/2 = node.x. Correct.

          // Correction: itemWidth includes the gap.
          // D3 nodeSize is [width + gap, height].
          // So the distance between centers is itemWidth.

          child.x = startX + (col * itemWidth);
          child.y = startY + (row * itemHeight);

          // Mark as grid node
          child.data.isGridNode = true;

          // Recurse for children (though grid nodes shouldn't have children usually)
          this.injectGridNodes(child);
        });
      }
    } else {
      // Recurse for non-grid nodes
      if (node.children) {
        node.children.forEach((child: any) => this.injectGridNodes(child));
      }
    }
  }

  private toggleNode(d: any): void {
    // Priority 1: If node is already expanded (has children), collapse it
    if (d.children) {
      // Collapsing
      d._children = d.children;
      d.children = null;

      // If we had previously revealed hidden siblings, restore the _hidden Children
      // so they get hidden again on next expand
      if (d.data._originalHiddenChildren) {
        d._hiddenChildren = d.data._originalHiddenChildren;
        d.data._hiddenSiblings = d.data._originalHiddenChildren.map((h: any) => h.data);
        d.data._originalHiddenChildren = null; // Clear after restoring
      }
      this.update(d);
      return;
    }

    // Priority 2: If there are hidden siblings (node is collapsed), reveal them first
    if (d.data._hiddenSiblings && d.data._hiddenSiblings.length > 0) {
      // Restore hidden siblings
      if (d._hiddenChildren) {
        d.children = (d._children || []).concat(d._hiddenChildren);

        // Don't null out _hiddenChildren yet - we need to remember them for later
        // Store them in a persistent flag
        d.data._originalHiddenChildren = d._hiddenChildren;
        d._hiddenChildren = null;
        d._children = null; // Important: clear _children since we moved them to children
      }
      d.data._hiddenSiblings = null; // Clear the flag so we know they are revealed

      this.update(d);
      return;
    }

    // Priority 3: Normal expand (node is collapsed and has no hidden siblings)
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }

    this.update(d);
  }

  private getChildrenCount(d: any): number {
    // Always return the total count from the data source
    if (d.data.children) {
      return d.data.children.length;
    }
    return 0;
  }

  // Apply hide siblings logic recursively
  private applyHideSiblingsLogic(node: any): void {
    if (!node.children && !node._children) return;

    const children = node.children || node._children;

    if (children) {
      // Check if any child has hideSiblings: true
      const hasHiddenSiblingRequest = children.some((child: any) => child.data.hideSiblings);

      if (hasHiddenSiblingRequest) {
        // Filter children
        const visible = children.filter((child: any) => child.data.hideSiblings);
        const hidden = children.filter((child: any) => !child.data.hideSiblings);

        // Store hidden children in a temporary property on the D3 node
        // so we can restore them later without losing their state
        node._hiddenChildren = hidden;

        // Update the active children array
        if (node.children) {
          node.children = visible;
        } else {
          node._children = visible;
        }

        // Also mark on data for easier checking
        node.data._hiddenSiblings = hidden.map((h: any) => h.data);
      }

      // Recurse
      children.forEach((child: any) => this.applyHideSiblingsLogic(child));
    }
  }

  // Reset view to apply hide siblings logic again
  public resetView(): void {
    // Re-create chart to reset all states
    this.createChart();
  }

  // Check if node matches search criteria (case insensitive)
  private matchesSearch(nodeData: OrgNode): boolean {
    if (!this.searchKeyword || this.searchKeyword.trim() === '') {
      return true; // No search active, show all
    }

    const keyword = this.searchKeyword.toLowerCase().trim();
    const name = (nodeData.name || '').toLowerCase();
    const employeeCode = (nodeData.employeeCode || '').toLowerCase();

    return name.includes(keyword) || employeeCode.includes(keyword);
  }

  // Calculate required padding based on card dimensions to prevent cropping
  private getRequiredPadding(): number {
    if (this.useCustomCard) {
      // Use half of custom card height to ensure no cropping
      return Math.max(this.customCardHeight / 2, this.chartPadding);
    } else {
      // Use half of default card height to ensure no cropping
      return Math.max(this.nodeHeight / 2, this.chartPadding);
    }
  }

  private searchTimeout: any;
  private zoomTimeout: any;

  // Search functionality
  public onSearch(): void {
    // Cancel any pending view updates from previous searches
    this.cancelPendingUpdates();

    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    // Check if search is effectively empty
    const keyword = this.searchKeyword ? this.searchKeyword.trim() : '';

    if (keyword === '') {
      this.showNoResults = false;
      this.expandAll(); // Reset to full view
      // Fit to screen after transition
      this.zoomTimeout = setTimeout(() => this.fitToScreen(), this.duration + 100);
      return;
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
      this.searchTimeout = null;
    }, 150);
  }

  private cancelPendingUpdates(): void {
    if (this.zoomTimeout) {
      clearTimeout(this.zoomTimeout);
      this.zoomTimeout = null;
    }
  }

  private performSearch(): void {
    const keyword = this.searchKeyword ? this.searchKeyword.trim() : '';

    // Double-check emptiness inside the debounced function
    if (keyword === '') {
      this.showNoResults = false;
      this.expandAll();
      this.zoomTimeout = setTimeout(() => this.fitToScreen(), this.duration + 100);
      return;
    }

    // Find all matching nodes
    const matchingNodes: any[] = [];
    const findMatchingNodes = (node: any) => {
      if (this.matchesSearch(node.data)) {
        matchingNodes.push(node);
      }
      if (node.children) {
        node.children.forEach(findMatchingNodes);
      } else if (node._children) {
        node._children.forEach(findMatchingNodes);
      }
    };

    findMatchingNodes(this.root);

    // If no matches, show no results message
    if (matchingNodes.length === 0) {
      this.showNoResults = true;
      this.update(this.root);
      return;
    }

    this.showNoResults = false;

    // Expand paths to matching nodes
    matchingNodes.forEach(node => {
      // Expand all ancestors
      let current = node;
      while (current.parent) {
        if (current.parent._children) {
          current.parent.children = current.parent._children;
          current.parent._children = null;
        }
        current = current.parent;
      }
    });

    this.update(this.root);

    // After update, scroll all matches into view
    if (matchingNodes.length > 0) {
      this.zoomTimeout = setTimeout(() => {
        this.scrollToMultipleNodesWithPadding(matchingNodes);
      }, this.duration + 100);
    }
  }

  // Clear search
  public clearSearch(): void {
    this.cancelPendingUpdates();

    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    this.searchKeyword = '';
    this.showNoResults = false;
    this.expandAll(); // Reset to full view
    // Fit to screen after clearing search
    this.zoomTimeout = setTimeout(() => this.fitToScreen(), this.duration + 100);
  }

  // Scroll a specific node into view
  private scrollToNode(node: any): void {
    const bounds = this.g.node().getBBox();
    const parent = this.svg.node().parentElement;
    const fullWidth = parent.clientWidth;
    const fullHeight = parent.clientHeight;

    // Node position
    const nodeX = node.x;
    const nodeY = node.y;

    // Calculate translate to center the node
    const translateX = (fullWidth / 2) - nodeX;
    const translateY = (fullHeight / 2) - nodeY;

    // Apply transform
    this.svg.transition().duration(500).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(1)
    );
  }

  // Scroll to show multiple nodes in view with padding
  private scrollToMultipleNodesWithPadding(nodes: any[]): void {
    if (nodes.length === 0) return;

    const parent = this.svg.node().parentElement;
    const fullWidth = parent.clientWidth;
    const fullHeight = parent.clientHeight;

    // Find bounding box of all matching nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    // Add extra padding to ensure nodes aren't cropped, especially top and bottom nodes
    const padding = this.getRequiredPadding();
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate width and height of the bounding box
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    // Calculate scale to fit all nodes in view
    const scaleX = fullWidth / boxWidth;
    const scaleY = fullHeight / boxHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in, only zoom out if needed

    // Calculate center of all nodes
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate translate to center the group
    const translateX = (fullWidth / 2) - (centerX * scale);
    const translateY = (fullHeight / 2) - (centerY * scale);

    // Apply transform
    this.svg.transition().duration(500).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    );
  }

  // Render default simple card
  private renderDefaultCard(nodeEnter: any): void {
    // Add rectangle for the node
    nodeEnter.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('x', -this.nodeWidth / 2)
      .attr('y', -this.nodeHeight / 2)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', '#fff')
      .style('stroke', '#4a90e2')
      .style('stroke-width', '2px')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    // Add name text
    nodeEnter.append('text')
      .attr('dy', '-0.5em')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text((d: any) => d.data.name);

    // Add title text
    nodeEnter.append('text')
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text((d: any) => d.data.title);

    // Add children count badge
    nodeEnter.append('circle')
      .attr('class', 'children-count')
      .attr('cx', this.nodeWidth / 2 - 15)
      .attr('cy', -this.nodeHeight / 2 + 15)
      .attr('r', 15)
      .style('fill', (d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? '#4a90e2' : 'none';
      })
      .style('stroke', (d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? '#fff' : 'none';
      })
      .style('stroke-width', '2px')
      .style('display', (d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? 'block' : 'none';
      });

    nodeEnter.append('text')
      .attr('class', 'children-count-text')
      .attr('x', this.nodeWidth / 2 - 15)
      .attr('y', -this.nodeHeight / 2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text((d: any) => {
        const childrenCount = this.getChildrenCount(d);
        return childrenCount > 0 ? childrenCount : '';
      });
  }

  // Render custom HTML card with avatar, email, phone, etc.
  private renderCustomCard(nodeEnter: any): void {
    // Card container
    const card = nodeEnter.append('foreignObject')
      .attr('width', this.customCardWidth)
      .attr('height', this.customCardHeight)
      .attr('x', -this.customCardWidth / 2)
      .attr('y', -this.customCardHeight / 2)
      .style('overflow', 'visible');

    // HTML content using foreignObject
    card.append('xhtml:div')
      .attr('class', 'custom-card')
      .html((d: any) => {
        const data = d.data;
        const childrenCount = this.getChildrenCount(d);
        return `
          <div class="card-content">
            <div class="card-header">
              ${data.avatar ? `<img src="${data.avatar}" class="avatar" alt="${data.name}" />` : '<div class="avatar-placeholder"></div>'}
              <div class="card-info">
                <div class="card-name">${data.name}</div>
                <div class="card-title">${data.title}</div>
              </div>
            </div>
            ${data.department ? `<div class="card-department"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> ${data.department}</div>` : ''}
            <div class="card-contact">
              ${data.email ? `<div class="card-email"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> ${data.email}</div>` : ''}
              ${data.phone ? `<div class="card-phone"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${data.phone}</div>` : ''}
            </div>
            ${childrenCount > 0 ? `<div class="card-badge">${childrenCount}</div>` : ''}
          </div>
        `;
      });
  }

  // Public methods for toolbar actions
  public expandAll(): void {
    const expand = (d: any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) {
        d.children.forEach(expand);
      }
    };

    expand(this.root);
    this.update(this.root);
    // Fit to screen will be called automatically after update transition
  }

  public collapseAll(): void {
    this.root.descendants().forEach((d: any) => {
      if (d.children && d.depth > 0) {
        d._children = d.children;
        d.children = null;
      }
    });
    this.update(this.root);
    // Fit to screen will be called automatically after update transition
  }

  public zoomIn(): void {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    const parent = svgNode.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.svg.transition().duration(300).call(
      this.zoom.scaleBy,
      1.3,
      [width / 2, height / 2]
    );
  }

  public zoomOut(): void {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    const parent = svgNode.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.svg.transition().duration(300).call(
      this.zoom.scaleBy,
      0.7,
      [width / 2, height / 2]
    );
  }



  public fitToScreen(): void {
    const bounds = this.g.node().getBBox();
    const parent = this.svg.node().parentElement;
    const fullWidth = parent.clientWidth;
    const fullHeight = parent.clientHeight;

    // Add extra padding to prevent cropping of top and bottom nodes
    const padding = this.getRequiredPadding();
    const width = bounds.width + (padding * 2);
    const height = bounds.height + (padding * 2);
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    if (width === 0 || height === 0) return;

    const scale = 1.0 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  }

  // Method to update org data dynamically
  public updateOrgData(newData: OrgNode): void {
    this.orgData = newData;
    this.createChart();
  }

  // Toggle link style between curved and 90-degree bend
  public toggleLinkStyle(): void {
    this.linkStyle = this.linkStyle === 'curved' ? 'straight' : 'curved';
    this.update(this.root);
  }

  // Toggle orientation between vertical and horizontal
  public toggleOrientation(): void {
    this.orientation = this.orientation === 'vertical' ? 'horizontal' : 'vertical';
    this.createChart(); // Recreate chart with new orientation
  }

  // Toggle between default and custom card
  public toggleCardStyle(): void {
    this.useCustomCard = !this.useCustomCard;
    this.createChart(); // Recreate chart with new card style
  }

  // Adjust grid columns
  public adjustGridColumns(delta: number): void {
    this.gridColumns = Math.max(1, Math.min(10, this.gridColumns + delta));
    this.createChart();
  }

  // Handle grid columns input change
  public onGridColumnsChange(): void {
    // Validate and clamp the value
    this.gridColumns = Math.max(1, Math.min(10, this.gridColumns));
    this.createChart();
  }

  // Handle grid layout toggle
  public onGridLayoutToggle(): void {
    this.createChart();
  }

  // Adjust sibling gap in pixels
  public adjustSiblingGap(delta: number): void {
    this.siblingGapPx = Math.max(0, Math.min(100, this.siblingGapPx + delta));
    this.createChart();
  }

  // Adjust cousin gap in pixels
  public adjustCousinGap(delta: number): void {
    this.cousinGapPx = Math.max(0, Math.min(100, this.cousinGapPx + delta));
    this.createChart();
  }

  // Adjust level gap in pixels
  public adjustLevelGap(delta: number): void {
    this.levelGapPx = Math.max(50, Math.min(200, this.levelGapPx + delta));
    this.createChart();
  }

  // Open dialog to add a new node
  public openAddNodeDialog(node: any): void {
    this.selectedNode = node;
    this.newNodeName = '';
    this.newNodeTitle = '';
    this.showAddNodeDialog = true;
  }

  // Close the add node dialog
  public closeAddNodeDialog(): void {
    this.showAddNodeDialog = false;
    this.selectedNode = null;
    this.newNodeName = '';
    this.newNodeTitle = '';
  }

  // Add a new child node to the selected node
  public addNode(): void {
    if (!this.newNodeName || !this.newNodeTitle) {
      return;
    }

    const newNode: OrgNode = {
      id: Date.now().toString(),
      name: this.newNodeName,
      title: this.newNodeTitle
    };

    // Add to data structure
    if (!this.selectedNode.data.children) {
      this.selectedNode.data.children = [];
    }
    this.selectedNode.data.children.push(newNode);

    // Update the hierarchy
    if (this.selectedNode.children) {
      this.selectedNode.children.push(d3.hierarchy(newNode));
    } else if (this.selectedNode._children) {
      this.selectedNode._children.push(d3.hierarchy(newNode));
    } else {
      this.selectedNode.children = [d3.hierarchy(newNode)];
    }

    // Re-initialize the tree
    this.root = d3.hierarchy(this.orgData);
    this.root.descendants().forEach((d: any) => {
      if (d._children) {
        d.children = d._children;
      }
    });

    this.update(this.root);
    this.closeAddNodeDialog();
  }
}
