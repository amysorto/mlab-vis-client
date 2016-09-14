import React, { PureComponent, PropTypes } from 'react';
import d3 from 'd3';

import './CountChart.scss';

/**
 * This chart is intended to be used paired with another chart. It
 * shares the same x-axis, width, margin left and margin right as the
 * other chart.
 *
 * @prop {String} highlightColor Color used to render the highlighted bars if provided
 * @prop {Array} highlightData Used to highlight a subset of the count data (typically a series object with { meta, results })
 */
export default class CountChart extends PureComponent {

  static propTypes = {
    data: PropTypes.array,
    height: PropTypes.number,
    highlightColor: PropTypes.string,
    highlightData: PropTypes.array,
    innerMarginLeft: PropTypes.number,
    innerMarginRight: PropTypes.number,
    numBins: PropTypes.number,
    width: PropTypes.number,
    xExtent: PropTypes.array,
    xKey: React.PropTypes.string,
    xScale: React.PropTypes.func,
    yExtent: PropTypes.array,
    yKey: React.PropTypes.string,
  };

  static defaultProps = {
    data: [],
    xKey: 'x',
    yKey: 'count',
    highlightColor: '#aaa',
  };

  /**
   * Initiailize the vis components when the component is about to mount
   */
  componentWillMount() {
    this.visComponents = this.makeVisComponents(this.props);
  }

  /**
   * When the react component mounts, setup the d3 vis
   */
  componentDidMount() {
    this.setup();
  }

  /**
   * When new component is updating, regenerate vis components if necessary
   */
  componentWillUpdate(nextProps) {
    // regenerate the vis components if the relevant props change
    this.visComponents = this.makeVisComponents(nextProps);
  }

  /**
   * When the react component updates, update the d3 vis
   */
  componentDidUpdate() {
    this.update();
  }

  /**
   * Initialize the d3 chart - this is run once on mount
   */
  setup() {
    const { width, height, innerMargin, innerHeight, innerWidth } = this.visComponents;

    // add in white background for saving as PNG
    d3.select(this.root).append('rect')
      .classed('chart-background', true)
      .attr('width', width)
      .attr('height', height)
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#fff');

    this.g = d3.select(this.root)
      .append('g')
      .attr('transform', `translate(${innerMargin.left} ${innerMargin.top})`);

    // add in axis groups
    this.yAxis = this.g.append('g').classed('y-axis', true);

    // render a line for the x-axis (no ticks)
    this.xAxis = this.g.append('g').classed('x-axis', true)
      .attr('transform', `translate(0 ${innerHeight})`);

    this.xAxis.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth);

    // add in groups for data
    this.bars = this.g.append('g').classed('bars-group', true);
    this.highlightBars = this.g.append('g').classed('highlight-bars-group', true);

    this.update();
  }

  makeVisComponents(props) {
    const { height, innerMarginLeft = 50, innerMarginRight = 20, width, xKey,
      xExtent, yExtent, yKey, data, numBins, highlightData, highlightColor } = props;
    let { xScale } = props;

    const innerMargin = {
      top: 20,
      right: innerMarginRight,
      bottom: 35,
      left: innerMarginLeft,
    };

    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;

    const xMin = 0;
    const xMax = innerWidth;
    const yMin = innerHeight;
    const yMax = 0;

    // set up the domains based on extent. Use the prop if provided, otherwise calculate
    const xDomain = xExtent || d3.extent(data, d => d[xKey]);
    let yDomain = yExtent || d3.extent(data, d => d[yKey]);

    // use the props xScale if provided, otherwise compute it
    if (!xScale) {
      xScale = d3.scaleLinear().domain(xDomain).range([xMin, xMax]);
    }

    // force a zero minimum
    yDomain = [0, yDomain[1]];

    // ensure a minimum y-domain size to prevent full sized rects at 0 value
    if (yDomain[0] === yDomain[1]) {
      yDomain = [yDomain[0], yDomain[0] + 1];
    }

    const yScale = d3.scaleLinear().domain(yDomain).range([yMin, yMax]);
    const binWidth = (xMax - xMin) / (numBins || data.length);

    return {
      binWidth,
      data,
      height,
      highlightColor,
      highlightData,
      innerHeight,
      innerMargin,
      innerWidth,
      width,
      xScale,
      xKey,
      yScale,
      yKey,
    };
  }

  /**
   * Update the d3 chart - this is the main drawing function
   */
  update() {
    this.renderAxes();
    this.renderMainBars();
    this.renderHighlightBars();
  }

  /**
   * Render the x and y axis components
   */
  renderAxes() {
    const { yScale } = this.visComponents;
    const yAxis = d3.axisLeft(yScale).ticks(4);

    this.yAxis.call(yAxis);
  }

  /**
   * Render the main count bars (not the highlight ones)
   */
  renderMainBars() {
    const { data } = this.visComponents;

    this.renderBars(this.bars, data, '#ccc');
  }

  /**
   * Render the highlight count bars
   */
  renderHighlightBars() {
    const { highlightData, highlightColor } = this.visComponents;

    this.renderBars(this.highlightBars, highlightData, highlightColor);
  }

  /**
   * Helper function to render the rects
   */
  renderBars(root, data = [], color = '#ccc') {
    const {
      xKey,
      xScale,
      yKey,
      yScale,
      binWidth,
      innerHeight,
    } = this.visComponents;

    const d3Color = d3.color(color);
    const lighterColor = d3Color ? d3Color.brighter(0.3) : undefined;

    const binding = root.selectAll('rect').data(data);

    // ENTER
    const entering = binding.enter()
      .append('rect')
        .attr('x', d => xScale(d[xKey]))
        .attr('y', yScale(0))
        .attr('width', binWidth)
        .attr('height', 0)
        .style('shape-rendering', 'crispEdges')
        .style('fill', d => (d.belowThreshold ? '#fff' : lighterColor))
        .style('stroke', d => (d.belowThreshold ? '#ddd' : color));

    // ENTER + UPDATE
    binding.merge(entering)
      .attr('x', d => xScale(d[xKey]))
      .attr('width', binWidth)
      .transition()
        .attr('y', d => yScale(d[yKey] || 0))
        .attr('height', d => innerHeight - yScale(d[yKey] || 0))
        .style('fill', d => (d.belowThreshold ? '#fff' : lighterColor))
        .style('stroke', d => (d.belowThreshold ? '#ddd' : color));


    // EXIT
    binding.exit()
      .remove();
  }

  /**
   * The main render method. Defers chart rendering to d3 in `update` and `setup`
   * @return {React.Component} The rendered container
   */
  render() {
    return (
      <g className="count-chart chart" ref={node => { this.root = node; }} />
    );
  }
}
