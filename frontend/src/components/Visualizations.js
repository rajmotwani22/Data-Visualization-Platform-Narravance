import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/Visualizations.css';

const Visualizations = ({ data, summary, filters }) => {
  const barChartRef = useRef();
  const timeChartRef = useRef();
  const pieChartRef = useRef();
  const heatmapRef = useRef();
  
  // Export chart as SVG or PNG
  const exportChart = (svgElement, fileName, fileType = 'png') => {
    // Get the SVG element
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    
    if (fileType === 'svg') {
      // Download as SVG
      const url = URL.createObjectURL(svg);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (fileType === 'png') {
      // Convert to PNG and download
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match SVG
      const svgRect = svgElement.getBoundingClientRect();
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;
      
      // Create image from SVG
      const image = new Image();
      const url = URL.createObjectURL(svg);
      
      image.onload = function() {
        // Fill canvas with white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        context.drawImage(image, 0, 0);
        URL.revokeObjectURL(url);
        
        // Create download link
        canvas.toBlob((blob) => {
          const imgUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = `${fileName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(imgUrl);
        });
      };
      
      image.src = url;
    }
  };

  // Add export buttons to each chart component
  const addExportButtons = (container, chartRef, chartName) => {
    const buttonContainer = d3.select(container)
      .append('div')
      .attr('class', 'export-buttons')
      .style('text-align', 'right')
      .style('margin-top', '10px');
      
    buttonContainer.append('button')
      .attr('class', 'export-btn export-svg')
      .text('Export SVG')
      .on('click', () => {
        const svgElement = d3.select(chartRef.current).select('svg').node();
        exportChart(svgElement, chartName, 'svg');
      });
      
    buttonContainer.append('button')
      .attr('class', 'export-btn export-png')
      .text('Export PNG')
      .on('click', () => {
        const svgElement = d3.select(chartRef.current).select('svg').node();
        exportChart(svgElement, chartName, 'png');
      });
  };
  
  // Group data by company for the bar chart
  const companyData = React.useMemo(() => {
    const groupedData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price)
      }),
      d => d.company
    );
    
    return Array.from(groupedData, ([company, data]) => ({
      company,
      count: data.count,
      totalSales: data.totalSales
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [data]);
  
  // Group data by month and year for the time chart
  const timeData = React.useMemo(() => {
    const groupedData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price),
        avgPrice: d3.mean(v, d => d.price)
      }),
      d => d.year,
      d => d.month
    );
    
    const result = [];
    
    groupedData.forEach((months, year) => {
      months.forEach((data, month) => {
        result.push({
          year,
          month,
          date: new Date(year, month - 1),
          count: data.count,
          totalSales: data.totalSales,
          avgPrice: data.avgPrice
        });
      });
    });
    
    return result.sort((a, b) => a.date - b.date);
  }, [data]);

  // Group data by source for the pie chart
  const sourceData = React.useMemo(() => {
    const groupedData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price)
      }),
      d => d.source
    );

    return Array.from(groupedData, ([source, data]) => ({
      source: source === 'source_a' ? 'Source A' : 
              source === 'source_b' ? 'Source B' : 
              source === 'source_c' ? 'Source C' : 'Unknown',
      count: data.count,
      totalSales: data.totalSales
    }));
  }, [data]);
  
  // Group data for the heatmap
  const heatmapData = React.useMemo(() => {
    if (!data.length) return [];
    
    // Create a map of company+year+month to source for lookup
    const sourceMap = new Map();
    data.forEach(d => {
      if (d.year && d.month && d.company) {
        const key = `${d.company}-${d.year}-${d.month}`;
        sourceMap.set(key, d.source);
      }
    });
    
    const companies = [...new Set(data.map(d => d.company))];
    const monthsData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price)
      }),
      d => d.company,
      d => d.year,
      d => d.month
    );
    
    // Transform data for heatmap
    const result = [];
    monthsData.forEach((yearData, company) => {
      yearData.forEach((monthData, year) => {
        monthData.forEach((data, month) => {
          const key = `${company}-${year}-${month}`;
          result.push({
            company,
            year,
            month,
            value: data.totalSales,
            source: sourceMap.get(key) || 'unknown'
          });
        });
      });
    });
    
    return result;
  }, [data]);
  
  // Create bar chart
  useEffect(() => {
    if (!companyData.length || !barChartRef.current) return;
    
    // Clear previous chart
    d3.select(barChartRef.current).selectAll('*').remove();
    
    const margin = { top: 30, right: 30, bottom: 70, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(barChartRef.current)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
        
    // X axis
    const x = d3.scaleBand()
      .range([0, width])
      .domain(companyData.map(d => d.company))
      .padding(0.2);
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');
        
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(companyData, d => d.totalSales) * 1.1])
      .range([height, 0]);
      
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `$${d3.format(',')(d)}`));
      
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Total Sales by Company');
      
    // Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .text('Total Sales ($)');
      
    // Add bars
    svg.selectAll('rect')
      .data(companyData)
      .enter()
      .append('rect')
        .attr('x', d => x(d.company))
        .attr('y', d => y(d.totalSales))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.totalSales))
        .attr('fill', '#4f9eda')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('fill', '#2a7ab8');
          
          // Show tooltip
          const tooltip = d3.select('.bar-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d.company}</strong><br>
              Total Sales: $${d3.format(',')(d.totalSales.toFixed(2))}<br>
              Number of Sales: ${d.count}
            `);
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill', '#4f9eda');
          d3.select('.bar-tooltip').style('display', 'none');
        });
        
    // Add export buttons
    addExportButtons(barChartRef.current, barChartRef, 'sales-by-company');
  }, [companyData]);
  
  // Create time series chart
  useEffect(() => {
    if (!timeData.length || !timeChartRef.current) return;
    
    // Clear previous chart
    d3.select(timeChartRef.current).selectAll('*').remove();
    
    const margin = { top: 30, right: 60, bottom: 70, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(timeChartRef.current)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
        
    // X axis
    const x = d3.scaleTime()
      .domain(d3.extent(timeData, d => d.date))
      .range([0, width]);
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b %Y')))
      .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');
        
    // Y axis for sales
    const y1 = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.totalSales) * 1.1])
      .range([height, 0]);
      
    svg.append('g')
      .call(d3.axisLeft(y1).tickFormat(d => `$${d3.format(',')(d)}`));
      
    // Y axis for count (right side)
    const y2 = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.count) * 1.1])
      .range([height, 0]);
      
    svg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(y2));
      
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Sales Over Time');
      
    // Y axis label (left)
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .text('Total Sales ($)');
      
    // Y axis label (right)
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', width + 40)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .text('Number of Sales');
      
    // Add line for total sales
    const salesLine = d3.line()
      .x(d => x(d.date))
      .y(d => y1(d.totalSales));
      
    svg.append('path')
      .datum(timeData)
      .attr('fill', 'none')
      .attr('stroke', '#4f9eda')
      .attr('stroke-width', 3)
      .attr('d', salesLine);
      
    // Add line for count
    const countLine = d3.line()
      .x(d => x(d.date))
      .y(d => y2(d.count));
      
    svg.append('path')
      .datum(timeData)
      .attr('fill', 'none')
      .attr('stroke', '#f79646')
      .attr('stroke-width', 3)
      .attr('d', countLine);
      
    // Add circles for sales points
    svg.selectAll('.sales-circle')
      .data(timeData)
      .enter()
      .append('circle')
        .attr('class', 'sales-circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y1(d.totalSales))
        .attr('r', 5)
        .attr('fill', '#4f9eda')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 8);
          
          // Show tooltip
          const tooltip = d3.select('.time-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br>
              Total Sales: $${d3.format(',')(d.totalSales.toFixed(2))}<br>
              Number of Sales: ${d.count}<br>
              Average Price: $${d3.format(',')(d.avgPrice.toFixed(2))}
            `);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
          d3.select('.time-tooltip').style('display', 'none');
        });
        
    // Add circles for count points
    svg.selectAll('.count-circle')
      .data(timeData)
      .enter()
      .append('circle')
        .attr('class', 'count-circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y2(d.count))
        .attr('r', 5)
        .attr('fill', '#f79646')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 8);
          
          // Show tooltip
          const tooltip = d3.select('.time-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br>
              Total Sales: $${d3.format(',')(d.totalSales.toFixed(2))}<br>
              Number of Sales: ${d.count}<br>
              Average Price: $${d3.format(',')(d.avgPrice.toFixed(2))}
            `);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
          d3.select('.time-tooltip').style('display', 'none');
        });
        
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, ${height - 80})`);
      
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 150)
      .attr('height', 80)
      .attr('fill', 'white')
      .attr('stroke', '#ccc');
      
    // Sales legend
    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 20)
      .attr('r', 6)
      .attr('fill', '#4f9eda');
      
    legend.append('text')
      .attr('x', 40)
      .attr('y', 20)
      .attr('dy', '0.32em')
      .text('Total Sales ($)');
      
    // Count legend
    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 50)
      .attr('r', 6)
      .attr('fill', '#f79646');
      
    legend.append('text')
      .attr('x', 40)
      .attr('y', 50)
      .attr('dy', '0.32em')
      .text('Number of Sales');
      
    // Add export buttons
    addExportButtons(timeChartRef.current, timeChartRef, 'sales-over-time');
  }, [timeData]);
  
  // Create pie chart
  useEffect(() => {
    if (!sourceData.length || !pieChartRef.current) return;
    
    // Clear previous chart
    d3.select(pieChartRef.current).selectAll('*').remove();

    // Add an external title to the chart for better positioning
    d3.select(pieChartRef.current)
      .append('div')
      .attr('class', 'chart-title')
      .text('Sales by Data Source');
    
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;
    
    // Create SVG - remove the extra height for better positioning
    const svg = d3.select(pieChartRef.current)
      .append('svg')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(['Source A', 'Source B', 'Source C'])
      .range(['#4f9eda', '#f79646', '#66c2a5']); 
      
    // Compute the position of each group on the pie
    const pie = d3.pie()
      .value(d => d.totalSales)
      .sort(null);
      
    const data_ready = pie(sourceData);
    
    // Build the pie chart
    svg.selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
      )
      .attr('fill', d => color(d.data.source))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        
        // Show tooltip
        const tooltip = d3.select('.pie-tooltip');
        tooltip.style('display', 'block')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 20}px`)
          .html(`
            <strong>${d.data.source}</strong><br>
            Total Sales: $${d3.format(',')(d.data.totalSales.toFixed(2))}<br>
            Number of Sales: ${d.data.count}<br>
            Percentage: ${(d.data.totalSales / d3.sum(sourceData, d => d.totalSales) * 100).toFixed(1)}%
          `);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
        d3.select('.pie-tooltip').style('display', 'none');
      });
      
    // Add percentages
    svg.selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('text')
      .text(d => {
        const percent = (d.data.totalSales / d3.sum(sourceData, d => d.totalSales) * 100).toFixed(1);
        return `${percent}%`;
      })
      .attr('transform', d => {
        const pos = d3.arc()
          .innerRadius(radius * 0.5)
          .outerRadius(radius * 0.8)
          .centroid(d);
        return `translate(${pos})`;
      })
      .style('text-anchor', 'middle')
      .style('font-size', '15px')
      .style('font-weight', 'bold')
      .style('fill', 'white');
    
    // Create an external HTML legend below the chart
    const legendContainer = d3.select(pieChartRef.current)
      .append('div')
      .attr('class', 'pie-chart-legend');
    
    // Add legend items for each source
    sourceData.forEach(d => {
      legendContainer.append('div')
        .attr('class', 'pie-chart-legend-item')
        .html(`
          <div class="pie-chart-legend-color" style="background-color: ${color(d.source)}"></div>
          <div class="pie-chart-legend-label">${d.source}</div>
        `);
    });
    
    // Add export buttons
    addExportButtons(pieChartRef.current, pieChartRef, 'sales-by-source');
  }, [sourceData]);
  
  // Create heatmap
  useEffect(() => {
    if (!heatmapData.length || !heatmapRef.current) return;
    
    // Clear previous chart
    d3.select(heatmapRef.current).selectAll('*').remove();
    
    // Extract unique companies and months
    const companies = [...new Set(heatmapData.map(d => d.company))];
    const months = [...new Set(heatmapData.map(d => d.month))].sort((a, b) => a - b);
    
    // Prepare dimensions and colors
    const margin = { top: 30, right: 30, bottom: 100, left: 120 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(heatmapRef.current)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
        
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Sales Heatmap by Company and Month');
    
    // X axis (months)
    const x = d3.scaleBand()
      .range([0, width])
      .domain(months)
      .padding(0.05);
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[d - 1];
      }))
      .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-65)');
    
    // Y axis (companies)
    const y = d3.scaleBand()
      .range([height, 0])
      .domain(companies)
      .padding(0.05);
      
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Build color scale
    const maxValue = d3.max(heatmapData, d => d.value);
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, maxValue]);
    
    // Create the heatmap cells
    svg.selectAll()
      .data(heatmapData)
      .enter()
      .append('rect')
        .attr('x', d => x(d.month))
        .attr('y', d => y(d.company))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', d => colorScale(d.value))
        .style('stroke', 'white')
        .style('stroke-width', 1)
        .on('mouseover', function(event, d) {
          // Highlight cell on hover
          d3.select(this)
            .style('stroke', '#333')
            .style('stroke-width', 2);
            
          // Show tooltip
          const tooltip = d3.select('.heatmap-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d.company}</strong><br>
              Month: ${d.month}/${d.year}<br>
              Sales: $${d3.format(',')(d.value.toFixed(2))}<br>
              Source: ${d.source === 'source_a' ? 'Source A' : 
                        d.source === 'source_b' ? 'Source B' : 
                        d.source === 'source_c' ? 'Source C' : 'Unknown'}
            `);
        })
        .on('mouseout', function() {
          // Reset on mouseout
          d3.select(this)
            .style('stroke', 'white')
            .style('stroke-width', 1);
            
          d3.select('.heatmap-tooltip').style('display', 'none');
        });
        
    // Add source indicators
    svg.selectAll('.source-indicator')
      .data(heatmapData)
      .enter()
      .append('text')
        .attr('class', 'source-indicator')
        .attr('x', d => x(d.month) + x.bandwidth() - 5)
        .attr('y', d => y(d.company) + 5)
        .text(d => {
          if (d.source === 'source_a') return 'A';
          if (d.source === 'source_b') return 'B';
          if (d.source === 'source_c') return 'C';
          return '?';
        })
        .attr('font-size', '8px')
        .attr('fill', 'white')
        .style('pointer-events', 'none');  // Don't interfere with mouse events

    // Add a legend
    const legendWidth = 20;
    const legendHeight = height;
    const legendSvg = svg.append('g')
      .attr('transform', `translate(${width + 20}, 0)`);
    
    // Create color gradient
    const defs = legendSvg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '100%')
      .attr('y2', '0%');
    
    // Set gradient stops
    linearGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(0));
      
    linearGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(maxValue));
    
    // Add the color scale rectangle
    legendSvg.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)');
    
    // Add axis to the legend
    const legendScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([legendHeight, 0]);
      
    legendSvg.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(d3.axisRight(legendScale)
        .tickFormat(d => `$${d3.format(',.0f')(d)}`))
      .selectAll('text')
        .style('font-size', '10px');
        
    legendSvg.append('text')
      .attr('transform', 'rotate(90)')
      .attr('x', legendHeight / 2)
      .attr('y', -legendWidth - 40)
      .attr('text-anchor', 'middle')
      .text('Sales ($)');
      
    // Add export buttons
    addExportButtons(heatmapRef.current, heatmapRef, 'sales-heatmap');
  }, [heatmapData]);
  
  return (
    <div className="visualizations">
      {data.length === 0 ? (
        <div className="no-data">No data available for the selected filters.</div>
      ) : (
        <>
          <div className="charts-container">
            <div className="chart-wrapper time-chart-wrapper">
              <div ref={timeChartRef} className="chart time-chart"></div>
              <div className="time-tooltip tooltip"></div>
            </div>
            
            <div className="chart-wrapper heatmap-chart-wrapper">
              <div ref={heatmapRef} className="chart heatmap-chart"></div>
              <div className="heatmap-tooltip tooltip"></div>
            </div>
            
            <div className="charts-row">
              <div className="chart-wrapper bar-chart-wrapper">
                <div ref={barChartRef} className="chart bar-chart"></div>
                <div className="bar-tooltip tooltip"></div>
              </div>
              
              <div className="chart-wrapper pie-chart-wrapper">
                <div ref={pieChartRef} className="chart pie-chart"></div>
                <div className="pie-tooltip tooltip"></div>
              </div>
            </div>
          </div>
          
          <div className="data-stats">
            <div className="stat-card">
              <h4>Total Records</h4>
              <p className="stat-value">{data.length}</p>
            </div>
            
            <div className="stat-card">
              <h4>Total Sales</h4>
              <p className="stat-value">
                ${data.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
              </p>
            </div>
            
            <div className="stat-card">
              <h4>Average Price</h4>
              <p className="stat-value">
                ${(data.reduce((sum, item) => sum + item.price, 0) / data.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="stat-card">
              <h4>Date Range</h4>
              <p className="stat-value">
                {data.length > 0 ? (
                  <>
                    {new Date(Math.min(...data.map(item => item.sale_date ? new Date(item.sale_date) : new Date()))).toLocaleDateString()}
                    {' to '}
                    {new Date(Math.max(...data.map(item => item.sale_date ? new Date(item.sale_date) : new Date()))).toLocaleDateString()}
                  </>
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Visualizations;