import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity } from '../types';
import { cn } from './ui';

interface GanttChartProps {
  activities: Activity[];
  className?: string;
}

export function GanttChart({ activities, className }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observeTarget = containerRef.current;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => resizeObserver.unobserve(observeTarget);
  }, []);

  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0 || activities.length === 0) return;

    // Clear previous SVG
    d3.select(containerRef.current).select('svg').remove();

    // Data parsing
    const data = activities
      .filter(a => a.startDate && a.finishDate)
      .map(a => ({
        ...a,
        start: new Date(a.startDate),
        end: new Date(a.finishDate)
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (data.length === 0) return;

    // Margins and dimensions
    const margin = { top: 30, right: 30, bottom: 30, left: 150 };
    const barHeight = 24;
    const padding = 8;
    const height = data.length * (barHeight + padding) + margin.top + margin.bottom;
    const width = dimensions.width;

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'sans-serif');

    const minDate = d3.min(data, d => d.start) as Date;
    const maxDate = d3.max(data, d => d.end) as Date;

    // Add some padding to domain
    const xDomain = [
      new Date(minDate.getTime() - 3 * 24 * 60 * 60 * 1000), 
      new Date(maxDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    ];

    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.id))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    // Axes
    const xAxis = d3.axisTop(xScale).tickFormat(d3.timeFormat('%b %d') as any);
    
    svg.append('g')
      .attr('transform', `translate(0,${margin.top})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .style('font-size', '12px');
      
    svg.selectAll('.domain, .tick line')
      .attr('stroke', '#e2e8f0');

    // Add gridlines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${margin.top})`)
      .call(d3.axisBottom(xScale)
        .tickSize(height - margin.top - margin.bottom)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '4,4');
      
    svg.selectAll('.domain').remove();

    // Bars
    const g = svg.append('g');

    // Background for each row to help reading
    g.selectAll('.row-bg')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'row-bg')
      .attr('x', margin.left)
      .attr('y', d => yScale(d.id)!)
      .attr('width', width - margin.left - margin.right)
      .attr('height', yScale.bandwidth())
      .attr('fill', (_, i) => i % 2 === 0 ? '#f8fafc' : 'transparent')
      .style('pointer-events', 'none');

    // Actual Gantt Bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.start))
      .attr('y', d => yScale(d.id)!)
      .attr('width', d => Math.max(xScale(d.end) - xScale(d.start), 4))
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => {
        if (d.status === 'Completed') return '#10b981'; // emerald-500
        if (d.status === 'In Progress') return '#3b82f6'; // blue-500
        if (d.status === 'Blocked') return '#ef4444'; // red-500
        return '#cbd5e1'; // slate-300
      });
      
    // Progress fill
    g.selectAll('.progress-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'progress-bar')
      .attr('x', d => xScale(d.start))
      .attr('y', d => yScale(d.id)!)
      .attr('width', d => {
        const fullWidth = Math.max(xScale(d.end) - xScale(d.start), 4);
        return fullWidth * (d.progress / 100);
      })
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', 'rgba(0,0,0,0.15)');

    // Labels
    const labels = svg.append('g');
    
    labels.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', margin.left - 10)
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .text(d => d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name)
      .attr('fill', '#334155')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .append('title')
      .text(d => d.name);
      
    // Value labels inside/next to bars
    g.selectAll('.progress-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'progress-label')
      .attr('x', d => {
        const barWidth = xScale(d.end) - xScale(d.start);
        return barWidth > 30 ? xScale(d.start) + 6 : xScale(d.end) + 6;
      })
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .text(d => `${d.progress}%`)
      .attr('fill', d => {
        const barWidth = xScale(d.end) - xScale(d.start);
        return barWidth > 30 ? '#ffffff' : '#64748b';
      })
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'absolute hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg p-3 text-sm z-50 pointer-events-none')
      .style('opacity', 0);

    g.selectAll('.bar')
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('opacity', 0.8);
        const format = d3.timeFormat('%b %d, %Y');
        
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div class="font-bold text-slate-900 dark:text-white mb-1">${d.name}</div>
          <div class="text-xs text-slate-500 mb-2">${d.id} • ${d.status}</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div><span class="text-slate-400">Start:</span> <span class="font-medium">${format(d.start)}</span></div>
            <div><span class="text-slate-400">End:</span> <span class="font-medium">${format(d.end)}</span></div>
            <div class="col-span-2"><span class="text-slate-400">Progress:</span> <span class="font-bold text-[#0B5FFF]">${d.progress}%</span></div>
          </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 28) + 'px');
        
        tooltip.classed('hidden', false);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.transition().duration(500).style('opacity', 0)
        .on('end', () => tooltip.classed('hidden', true));
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      });

  }, [activities, dimensions]);

  return (
    <div className={cn("relative w-full h-full min-h-[300px]", className)} ref={containerRef}>
      {/* Chart will be rendered here by D3 */}
    </div>
  );
}
