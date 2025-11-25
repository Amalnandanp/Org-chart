import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  children?: OrgNode[];
  _children?: OrgNode[];
  collapsed?: boolean;
  // Custom fields for card template
  avatar?: string;
  email?: string;
  phone?: string;
  department?: string;
  customData?: any;
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
  public linkStyle: 'curved' | 'straight' = 'curved'; // Toggle between curved and 90deg bend
  public useCustomCard = false; // Toggle between default and custom card
  public showAddNodeDialog = false;
  public selectedNode: any = null;
  public newNodeName = '';
  public newNodeTitle = '';

  // Sample org data - you can replace this with your actual data
  private orgData: OrgNode = {
    id: '1',
    name: 'John Doe',
    title: 'CEO',
    avatar: 'https://i.pravatar.cc/150?img=12',
    email: 'john.doe@company.com',
    phone: '+1 234 567 8900',
    department: 'Executive',
    children: [
      {
        id: '2',
        name: 'Jane Smith',
        title: 'CTO',
        avatar: 'https://i.pravatar.cc/150?img=5',
        email: 'jane.smith@company.com',
        phone: '+1 234 567 8901',
        department: 'Technology',
        children: [
          {
            id: '4',
            name: 'Bob Wilson',
            title: 'Engineering Manager',
            avatar: 'https://i.pravatar.cc/150?img=13',
            email: 'bob.wilson@company.com',
            department: 'Engineering',
            children: [
              { id: '7', name: 'Alice Brown', title: 'Senior Developer', avatar: 'https://i.pravatar.cc/150?img=1', department: 'Engineering' },
              { id: '8', name: 'Charlie Davis', title: 'Developer', avatar: 'https://i.pravatar.cc/150?img=8', department: 'Engineering' },
              { id: '9', name: 'Diana Evans', title: 'Junior Developer', avatar: 'https://i.pravatar.cc/150?img=9', department: 'Engineering' }
            ]
          },
          {
            id: '5',
            name: 'Emma Johnson',
            title: 'QA Manager',
            avatar: 'https://i.pravatar.cc/150?img=10',
            email: 'emma.johnson@company.com',
            department: 'Quality Assurance',
            children: [
              { id: '10', name: 'Frank Green', title: 'QA Engineer', avatar: 'https://i.pravatar.cc/150?img=11', department: 'Quality Assurance' },
              { id: '11', name: 'Grace Harris', title: 'QA Engineer', avatar: 'https://i.pravatar.cc/150?img=3', department: 'Quality Assurance' }
            ]
          }
        ]
      },
      {
        id: '3',
        name: 'Mike Taylor',
        title: 'CFO',
        avatar: 'https://i.pravatar.cc/150?img=14',
        email: 'mike.taylor@company.com',
        phone: '+1 234 567 8902',
        department: 'Finance',
        children: [
          {
            id: '6',
            name: 'Sarah Miller',
            title: 'Accounting Manager',
            avatar: 'https://i.pravatar.cc/150?img=4',
            email: 'sarah.miller@company.com',
            department: 'Accounting',
            children: [
              { id: '12', name: 'Henry Clark', title: 'Accountant', avatar: 'https://i.pravatar.cc/150?img=15', department: 'Accounting' },
              { id: '13', name: 'Ivy Lewis', title: 'Accountant', avatar: 'https://i.pravatar.cc/150?img=2', department: 'Accounting' }
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

    // Create tree layout
    const nodeSize: [number, number] = this.useCustomCard ? [280, 200] : [this.nodeWidth + 50, this.nodeHeight + 80];
    this.tree = d3.tree()
      .nodeSize(nodeSize)
      .separation((a: any, b: any) => {
        return a.parent === b.parent ? 1 : 1.2;
      });

    // Process data
    this.root = d3.hierarchy(this.orgData);
    this.root.x0 = 0;
    this.root.y0 = 0;

    // Initialize all nodes as expanded
    this.root.descendants().forEach((d: any) => {
      d._children = d.children;
    });

    this.update(this.root);
  }

  private update(source: any): void {
    const treeData = this.tree(this.root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Normalize for fixed-depth
    nodes.forEach((d: any) => {
      d.y = d.depth * 180;
    });

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
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

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
    if (this.linkStyle === 'straight') {
      // 90-degree bend (right angle)
      return `M ${s.x} ${s.y}
              V ${(s.y + d.y) / 2}
              H ${d.x}
              V ${d.y}`;
    } else {
      // Curved path (default)
      return `M ${s.x} ${s.y}
              C ${s.x} ${(s.y + d.y) / 2},
                ${d.x} ${(s.y + d.y) / 2},
                ${d.x} ${d.y}`;
    }
  }

  private toggleNode(d: any): void {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    this.update(d);
  }

  private getChildrenCount(d: any): number {
    if (d._children) {
      return d._children.length;
    } else if (d.children) {
      return d.children.length;
    }
    return 0;
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
    const cardWidth = 220;
    const cardHeight = 140;

    // Card container
    const card = nodeEnter.append('foreignObject')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('x', -cardWidth / 2)
      .attr('y', -cardHeight / 2)
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
    this.root.descendants().forEach((d: any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    });
    this.update(this.root);
  }

  public collapseAll(): void {
    this.root.descendants().forEach((d: any) => {
      if (d.children && d.depth > 0) {
        d._children = d.children;
        d.children = null;
      }
    });
    this.update(this.root);
  }

  public zoomIn(): void {
    this.svg.transition().duration(300).call(
      this.zoom.scaleBy,
      1.3
    );
  }

  public zoomOut(): void {
    this.svg.transition().duration(300).call(
      this.zoom.scaleBy,
      0.7
    );
  }

  public resetZoom(): void {
    this.svg.transition().duration(300).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(this.width / 2, 50)
    );
  }

  public fitToScreen(): void {
    const bounds = this.g.node().getBBox();
    const parent = this.svg.node().parentElement;
    const fullWidth = parent.clientWidth;
    const fullHeight = parent.clientHeight;

    // Add padding to prevent cropping (increased for custom cards)
    const padding = this.useCustomCard ? 80 : 60;
    const width = bounds.width + (padding * 2);
    const height = bounds.height + (padding * 2);
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    if (width === 0 || height === 0) return;

    const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight);
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

  // Toggle between default and custom card
  public toggleCardStyle(): void {
    this.useCustomCard = !this.useCustomCard;
    this.createChart(); // Recreate chart with new card style
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
