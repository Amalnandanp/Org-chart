import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  children?: OrgNode[];
  _children?: OrgNode[];
  collapsed?: boolean;
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
  private height = 800;
  private duration = 750;
  private nodeWidth = 180;
  private nodeHeight = 80;

  // Sample org data - you can replace this with your actual data
  private orgData: OrgNode = {
    id: '1',
    name: 'John Doe',
    title: 'CEO',
    children: [
      {
        id: '2',
        name: 'Jane Smith',
        title: 'CTO',
        children: [
          {
            id: '4',
            name: 'Bob Wilson',
            title: 'Engineering Manager',
            children: [
              { id: '7', name: 'Alice Brown', title: 'Senior Developer' },
              { id: '8', name: 'Charlie Davis', title: 'Developer' },
              { id: '9', name: 'Diana Evans', title: 'Junior Developer' }
            ]
          },
          {
            id: '5',
            name: 'Emma Johnson',
            title: 'QA Manager',
            children: [
              { id: '10', name: 'Frank Green', title: 'QA Engineer' },
              { id: '11', name: 'Grace Harris', title: 'QA Engineer' }
            ]
          }
        ]
      },
      {
        id: '3',
        name: 'Mike Taylor',
        title: 'CFO',
        children: [
          {
            id: '6',
            name: 'Sarah Miller',
            title: 'Accounting Manager',
            children: [
              { id: '12', name: 'Henry Clark', title: 'Accountant' },
              { id: '13', name: 'Ivy Lewis', title: 'Accountant' }
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
    this.tree = d3.tree()
      .nodeSize([this.nodeWidth + 50, this.nodeHeight + 80])
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

    // Add click event to toggle children
    nodeEnter.on('click', (_event: any, d: any) => {
      this.toggleNode(d);
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
    return `M ${s.x} ${s.y}
            C ${s.x} ${(s.y + d.y) / 2},
              ${d.x} ${(s.y + d.y) / 2},
              ${d.x} ${d.y}`;
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
    const fullHeight = this.height;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width === 0 || height === 0) return;

    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
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
}
