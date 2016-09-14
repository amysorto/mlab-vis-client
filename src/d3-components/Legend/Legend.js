import d3 from 'd3';

/**
 * D3 Component for rendering a legend
 * Typically initialized in makeVisComponents() and then rendered with a passed in
 * root container node.
 */
export default class Legend {
  constructor({ data = [], colors, formatter = d => d, width, onHoverLegendEntry }) {
    this.data = data;
    this.colors = colors;
    this.formatter = formatter;
    this.width = width;
    this.onHoverLegendEntry = onHoverLegendEntry;

    const entryMarginRight = 14;
    const minEntryWidth = 180;
    const maxEntriesPerRow = 3;

    this.config = {
      entry: {
        height: 14,
        width: Math.max(Math.floor(this.width / maxEntriesPerRow) - entryMarginRight, minEntryWidth),
        margin: { bottom: 4, right: entryMarginRight },
      },
      colorBox: {
        width: 8,
        margin: 2,
      },
    };

    this.numEntriesPerRow = Math.floor(this.width / this.config.entry.width);
    this.numRows = Math.ceil(data.length / this.numEntriesPerRow);
    const legendPaddingBottom = 4;
    this.height = (this.numRows * (this.config.entry.height + this.config.entry.margin.bottom)) + legendPaddingBottom;
  }

  /**
   * Renders the legend to the `root` container
   *
   * @param {Object} root A d3 selection of a container to render the legend in
   * @param {Array} values Array of values corresponding to the data array. If provided,
   *   these values show up in the legend (typically used for mouse behavior)
   * @return {void}
   */
  render(root, values) {
    const binding = root.selectAll('.legend-entry').data(this.data, d => d.meta.id);
    binding.exit().remove();

    const { entry: entryConfig, colorBox: colorBoxConfig } = this.config;
    const colors = this.colors;
    const onHoverLegendEntry = this.onHoverLegendEntry;

    // render entering entries (one per item in data)
    const entering = binding.enter().append('g')
      .attr('class', 'legend-entry')
      .each(function legendEnter(d) {
        const entry = d3.select(this);

        const entryId = String(Math.random()).replace(/\./, '');
        const clipId = `legend-clip-${entryId}`;

        // use the provided color or default to gray
        const color = colors[d.meta.id] || '#aaa';

        entry.attr('clip-path', `url(#${clipId})`);

        // add in the clipping rects to prevent text from extending beyond the width
        entry.append('defs')
          .append('clipPath')
            .attr('id', clipId)
          .append('rect')
            .attr('width', entryConfig.width)
            .attr('height', entryConfig.height);

        // draw the color box
        entry.append('rect')
          .attr('class', 'legend-color-box')
          .attr('y', 3)
          .attr('width', colorBoxConfig.width)
          .attr('height', colorBoxConfig.width)
          .style('fill', color);

        // draw the label for the entry
        entry.append('text')
          .attr('class', 'legend-entry-label')
          .attr('x', colorBoxConfig.width + colorBoxConfig.margin)
          .attr('dy', 12)
          .text(d.meta.label);

        // prepare the area where values are shown
        // this is the white bg rect to overlap the label text if necessary
        entry.append('rect')
          .attr('class', 'legend-entry-value-bg')
          .attr('x', entryConfig.width)
          .attr('width', 0)
          .attr('height', entryConfig.height)
          .style('fill', '#fff');

        // the value text element when values are provided
        entry.append('text')
          .attr('class', 'legend-entry-value')
          .attr('dy', 12)
          .attr('x', entryConfig.width)
          .attr('text-anchor', 'end')
          .style('fill', color);

        // mouse listener rect over the entry
        entry.append('rect')
          .attr('width', entryConfig.width)
          .attr('height', entryConfig.height)
          .style('fill', '#f00')
          .style('stroke', 'none')
          .style('opacity', 0)
          .on('mouseenter', () => onHoverLegendEntry(d))
          .on('mouseleave', () => onHoverLegendEntry(null));
      });

    const formatter = this.formatter;

    // UPDATE + ENTER -- mostly for hover behavior to show values
    binding.merge(entering)
      // ensure the entry is in the correct position
      .attr('transform', (d, i) => {
        const rowNum = Math.floor(i / this.numEntriesPerRow);
        const numInRow = i % this.numEntriesPerRow;

        const x = numInRow * (entryConfig.width + entryConfig.margin.right);
        const y = rowNum * (entryConfig.height + entryConfig.margin.bottom);
        return `translate(${x} ${y})`;
      })
      // show the current value or hide it if no values provided
      .each(function legendUpdate(d, i) {
        const entry = d3.select(this);

        // if value is nully render it as -- otherwise use the formatter
        let highlightValue;
        if (values) {
          highlightValue = values[i] == null ? '--' : formatter(values[i]);
        }

        // if a value was provided, render it
        if (highlightValue !== undefined) {
          const valueText = entry.select('.legend-entry-value')
            .style('display', '')
            .text(highlightValue);

          // make sure the bg rect is wide enough to fit the value on top
          const valueTextBBox = valueText.node().getBBox();
          const valueTextMargin = 4;
          entry.select('.legend-entry-value-bg')
            .style('display', '')
            .attr('x', Math.floor(valueTextBBox.x) - valueTextMargin)
            .attr('width', (2 * valueTextMargin) + Math.ceil(valueTextBBox.width));

        // no highlight value, so hide it
        } else {
          entry.select('.legend-entry-value').style('display', 'none');
          entry.select('.legend-entry-value-bg').style('display', 'none');
        }
      });
  }
}
