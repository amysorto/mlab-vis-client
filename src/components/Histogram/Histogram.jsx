import React, { PureComponent, PropTypes } from 'react';
import d3 from 'd3';
import { mod } from '../../utils/math';

import './Histogram.scss';

/**
 * This chart is intended to be used paired with another chart. It
 * shares the same x-axis, width, margin left and margin right as the
 * other chart.
 *
 * @prop {String} highlightColor Color used to render the highlighted bars if provided
 * @prop {Array} highlightData Used to highlight a subset of the count data (typically a series object with { meta, results })
 */
export default class Histogram extends PureComponent {

  static propTypes = {
    binStart: PropTypes.number,
    binWidth: PropTypes.number,
    bins: PropTypes.array,
    color: PropTypes.string,
    height: PropTypes.number,
    id: PropTypes.string,
    usePercent: PropTypes.bool,
    width: PropTypes.number,
    yExtent: PropTypes.array,
  };

  static defaultProps = {
    bins: [],
    binStart: 4,
    binWidth: 4,
    color: '#888',
    id: 'histogram',
    height: 200,
    width: 200,
    usePercent: false,
  };

  /**
   * Initiailize the vis components when the component is about to mount
   */
  componentWillMount() {
    // Holds refs to chart node for line updating.
    this.root = null;

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
    const { width, height } = this.props;

    // add in white background for saving as PNG
    d3.select(this.root).append('rect')
      .classed('chart-background', true)
      .attr('width', width)
      .attr('height', height)
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#fff');

    this.g = d3.select(this.root)
      .append('g');

    // add in axis groups
    this.xAxis = this.g.append('g').classed('x-axis', true);
    this.yAxis = this.g.append('g').classed('y-axis', true);

    this.xAxis.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth);

    // add in groups for data
    this.bars = this.g.append('g').classed('bars-group', true);
    this.highlightBars = this.g.append('g').classed('highlight-bars-group', true);

    this.update();
  }

  makeVisComponents(props) {
    const {
            yExtent,
            usePercent,
            binStart,
            binWidth,
            width,
            height,
            color,
            innerMarginLeft = 50,
            innerMarginRight = 10,
            innerMarginTop = 20,
          } = props;

    let { bins } = props;

    const binEnd = (binStart) + (binWidth * (bins.length - 1));
    console.log(binStart);

    const innerMargin = {
      top: innerMarginTop,
      right: innerMarginRight,
      bottom: 35,
      left: innerMarginLeft,
    };

    const chartWidth = width - innerMargin.left - innerMargin.right;

    const chartHeight = height - innerMargin.top - innerMargin.bottom;

    const xValues = d3.range(binStart, binEnd, binWidth);
    console.log(xValues);

    const xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, chartWidth]);

    let yDomain = yExtent;
    if (!yDomain && usePercent) {
      yDomain = [0, 100.0];
    } else {
      yDomain = d3.extent(bins);
    }

    if (usePercent) {
      const totalValue = d3.sum(bins);
      bins = bins.map(b => (b / totalValue) * 100.0);
    }

    // force a zero minimum
    yDomain = [0, yDomain[1]];
    //
    // const xScale = d3.scaleLinear().range([0, chartWidth]).clamp(true);
    // if (xDomain) {
    //   xScale.domain(xDomain);
    // }

    const yScale = d3.scaleLinear().range([chartHeight, 0]).clamp(true);
    if (yDomain) {
      yScale.domain(yDomain);
    }

    // const numBins = bins.length;

    // const binWidth = (chartWidth - 0) / numBins;

    return {
      innerMargin,
      binWidth,
      bins,
      height,
      color,
      chartWidth,
      chartHeight,
      width,
      xValues,
      xScale,
      yScale,
    };
  }

  /**
   * Update the d3 chart - this is the main drawing function
   */
  update() {
    const { innerMargin } = this.visComponents;
    this.g.attr('transform', `translate(${innerMargin.left} ${innerMargin.top})`);

    this.updateAxes();
    this.updateBars();
  }

  /**
   * Render the x and y axis components
   */
  updateAxes() {
    const { xScale, xValues, yScale, chartHeight } = this.visComponents;

    const yTicks = Math.round(chartHeight / 50);
    const xTicks = xValues.filter((t, i) => i === 0 || mod(t, 12) === 0);

    const xAxis = d3.axisBottom(xScale).tickValues(xTicks).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(yTicks).tickSizeOuter(0);

    this.yAxis.call(yAxis);

    this.xAxis
      .attr('transform', `translate(0 ${chartHeight + 3})`)
      .call(xAxis);
  }
  /**
   * Render the main count bars (not the highlight ones)
   */
  updateBars() {
    const { bins } = this.visComponents;

    this.renderBars(this.bars, bins);
  }

  /**
   * Helper function to render the rects
   */
  renderBars(root, data = []) {
    const {
      xScale,
      xValues,
      yScale,
      chartHeight,
      color,
    } = this.visComponents;


    const binding = root.selectAll('rect').data(data);

    // ENTER
    const entering = binding.enter()
      .append('rect')
        .attr('y', yScale(0))
        .attr('height', 0)
        .style('shape-rendering', 'crispEdges')
        .style('fill', color)
        .style('stroke', color);

    // ENTER + UPDATE
    binding.merge(entering)
      .attr('x', (d, i) => xScale(xValues[i]))
      .attr('width', xScale.bandwidth)
      .transition()
        .attr('y', d => yScale(d || 0))
        .attr('height', d => chartHeight - yScale(d || 0))
        .style('fill', color)
        .style('stroke', color);


    // EXIT
    binding.exit()
      .remove();
  }

  /**
   * The main render method. Defers chart rendering to d3 in `update` and `setup`
   * @return {React.Component} The rendered container
   */
  render() {
    const { width, height, id } = this.props;
    return (
      <div>
        <svg
          id={id}
          className="histogram chart"
          height={height}
          ref={node => { this.root = node; }}
          width={width}
        />
      </div>
    );
  }
}
