import { Chart } from "./chart.js";
import { barycenterColor, updateDict, getDimensionText, unique } from "./utils.js";

class Sparkline extends Chart {
    constructor(id, type = "sparkline", options = {}, width = null, height = null) {
        super(id, type, options, width, height);
        let defaultOptions = {
            "style": {
                "tooltipDotColor": ((d) => this._options.sparkline["circle-color"]),
                "tooltipDotSize": 2,
            },
            "sparkline": {
                "range": null, // either null or array [min, max]
                "textLastPoint": true,
                "strokeWidth": 1,
                "lineColor": this._style.color,
                "circleColor": "#f00",
                "textColor": "#f00",
                "textFontSize": "85%",
                "textFontWeight": "600",
                "rangeFillColor": barycenterColor(this._style.color,
                                                  this._style.backgroundColor,
                                                  0.2)
            }
        };
        updateDict(defaultOptions, options); // update default options with user options
        this.options = defaultOptions; // update object options with default & user options.
    }
    
    /**
     * Draw the Grapher object
     * @param {Object|null} options - you can pass an options Object to update the element's option. @link Grapher
     */
    draw(options) {
        if (options) {
            this.options = options;
        }
        // Adjust width of svg
        this._svgSetWidth();
        
        if (this._options.type == "sparkline") {
            this._sparkline();
        } else if (this._options.type == "sparklines") {
            this._sparklines();
        }
        this._addTooltip();
    }

    // Graph internal methods
    // =======================
    _svgSetWidth() {
        // this method is used to adjust svg width in case of sparkline
        // to make sure the label and last value are set inside
        // the container
        this.sparkTextWidth = 0;
        if (this._options.sparkline.textLastPoint) {
            this.lastPoint = this.data.slice(-1)[0];
            let textLastPoint = this._options.y.tickFormat(this.lastPoint);
            this.sparkTextWidth += getDimensionText(textLastPoint,this._options.sparkline.textFontSize).width;
        }
        if (this._options.y.label) {
            this.sparkTextWidth += getDimensionText(this._options.y.label,this._options.sparkline.textFontSize).width + 16*0.4;
        }
        // Adjust svg width
        this.svgWidth = this.width - this.sparkTextWidth;
        this.svg.attr('width', this.svgWidth);
    }
    _sparkline() {
        // Define X-axis
        this.x = d3.scaleLinear()
            .range([0, this.svgWidth-2])
            .domain((this._options.x.domain ? this._options.x.domain : this.extent(this._options.x.name, this._options.x.scale)));
        this.xValues = unique(this.data.map(d => d[this._options.x.name]));
        
        // Define y-axis
        this.y = d3.scaleLinear()
            .range([this.svgHeight-4, 0])
            .domain(this._options.y.domain ? this._options.y.domain : this.extent(this._options.y.name, this._options.y.scale));
        
        // Remove existing
        this.svg.selectAll('g.sparkline').remove();

        // Change svg and g container
        this.container.attr('style','vertical-align:middle; display:inline-block;');
        this.g.attr('transform', 'translate(0,2)')
            .attr('class','sparkline');


        // Add range
        if (this._options.sparkline.range) {
            let dataRange = this.data.map(d => {d.minRange = this._options.sparkline.range[0]; d.maxRange = this._options.sparkline.range[1]; return d;});
            this.g.append('path')
                .datum(dataRange)
                .attr('fill', this._options.sparkline.rangeFillColor)
                .attr('stroke','none')
                .attr('d', d3.area()
                      .x(d => this.x(d[this._options.x.name]))
                      .y0(d => this.y(d.minRange))
                      .y1(d => this.y(d.maxRange)));
        }
        // Add sparkline
        this.sparkLine = this.g.append('path')
            .datum(this.data)
            .attr('class', 'sparkLine')
            .attr('fill', 'none')
            .attr('stroke-width', this._options.style.strokeWidth)
            .attr('stroke', this._options.sparkline.lineColor)
            .attr('d',d3.line()
                  .curve(d3.curveBasis)
                  .x(d => this.x(d[this._options.x.name]))
                  .y(d => this.y(d[this._options.y.name])));

        // Add point and circle for lastPoint
        this.lastPoint = this.data.slice(-1)[0];
        this.sparkCircle = this.g.append('circle')
            .attr('class','sparkCircle')
            .attr('cx', this.x(this.lastPoint[this._options.x.name]))
            .attr('cy', this.y(this.lastPoint[this._options.y.name]))
            .attr('r', 1.5)
            .attr('fill', this._options.sparkline.circleColor)
            .attr('stroke', 'none');

        
        // Text for last point and label
        this.container.selectAll('.sparkText').remove();
        if (this._options.sparkline.textLastPoint) {
            this.sparkTextLastPoint = this.container
                .append('span')
                .attr('class','sparkText')
                .text(this._options.y.tickFormat(this.lastPoint[this._options.y.name]))
                .attr('style', `font-size:${this._options.sparkline.textFontSize}; font-weight:${this._options.sparkline.textFontWeight}; color: ${this._options.sparkline.textColor}; margin-bottom:${this.svgHeight/2}; vertical-align:middle; display:inline-block;`);
        }
        if (this._options.y.label) {
            this.sparkTextYLabel = this.container
                .append('span')
                .attr('class','sparkText')
                .text(this._options.y.label)
                .attr('style', `font-size:${this._options.sparkline.textFontSize}; font-weight:${this._options.sparkline.textFontWeight}; margin-bottom:${this.svgHeight/2}; vertical-align:middle; display:inline-block; padding-left: 0.4rem;`);
        }       
    }
    _sparklines() {
        // Define X-axis
        this.x = d3.scaleLinear()
            .range([0, this.svgWidth-2])
            .domain((this._options.x.domain ? this._options.x.domain : this.extent(this._options.x.name, this._options.x.scale)));
        this.xValues = unique(this.data.map(d => d[this._options.x.name]));
        
        // Define y-axis
        this.y = d3.scaleLinear()
            .range([this.svgHeight-4, 0])
            .domain(this._options.y.domain ? this._options.y.domain : this.extent(this._options.y.name, this._options.y.scale));
        
        // Remove existing
        this.svg.selectAll('g.sparkline').remove();

        // Change svg and g container
        this.container.attr('style','vertical-align:middle; display:inline-block;');
        this.g.attr('transform', 'translate(0,2)')
            .attr('class','sparkline');

        // Add range
        if (this._options.sparkline.range) {
            let dataRange = this.data.map(
                d => { d.minRange = this._options.sparkline.range[0];
                       d.maxRange = this._options.sparkline.range[1];
                       return d;}
            );
            this.g.append('path')
                .datum(dataRange)
                .attr('fill', this._options.sparkline.rangeFillColor)
                .attr('stroke','none')
                .attr('d', d3.area()
                      .x(d => this.x(d[this._options.x.name]))
                      .y0(d => this.y(d.minRange))
                      .y1(d => this.y(d.maxRange)));
        }
        this.container.selectAll('.sparkText').remove();
        this._paths = {};
        this._sparkTextLastPoints = {};
        this._sparkTextYLabels = {};
        for (const category of this._options._categories) {
            let dataFiltered = this.data.filter(
                d => d[this._options.category.name] === category
            );
            this._paths[category] = this.g.append('path')
                .datum(dataFiltered)
                .attr('class', 'sparkLine')
                .attr('fill', 'none')
                .attr('stroke-width', this._options.style.strokeWidth)
                .attr('stroke', this.color(category))
                .attr('d', d3.line()
                      .curve(d3.curveCatmullRom)
                      .x(d => this.x(d[this._options.x.name]))
                      .y(d => this.y(d[this._options.y.name])));
            this.lastPoint = dataFiltered.slice(-1)[0];
            this.sparkCircle = this.g.append('circle')
                .attr('class','sparkCircle')
                .attr('cx', this.x(this.lastPoint[this._options.x.name]))
                .attr('cy', this.y(this.lastPoint[this._options.y.name]))
                .attr('r', 1.5)
                .attr('fill', this.color(category))
                .attr('stroke', 'none');
            if (this._options.sparkline.textLastPoint) {
                this._sparkTextLastPoints[category] = this.container
                    .append('span')
                    .attr('class',`sparkText ${category}`)
                    .text(this._options.y.tickFormat(this.lastPoint[this._options.y.name]))
                    .attr('style', `font-size:${this._options.sparkline.textFontSize}; font-weight:${this._options.sparkline.textFontWeight}; color: ${this.color(category)}; margin-bottom:${this.svgHeight/2}; vertical-align:middle; display: none;`);
                this._sparkTextYLabels[category] = this.container
                    .append('span')
                    .attr('class',`sparkText ${category}`)
                    .text(category)
                    .attr('style', `font-size:${this._options.sparkline.textFontSize}; font-weight:${this._options.sparkline.textFontWeight}; margin-bottom:${this.svgHeight/2}; vertical-align:middle; padding-left: 0.4rem; display: none;`);
            }
        }
    }
    _buildTooltip(g, data, mouseX, mouseY) {
        if (! data) return g.style("display","none");
        g.style("display", null);

        const xLine = g.selectAll("line")
              .data([null])
              .join("line")
              .attr("class", "tooltip_line")
              .attr('style',`stroke: ${this._options.style.tooltipLineColor};`)
              .attr("x1", mouseX)
              .attr("x2", mouseX) 
              .attr("y1", 0)
              .attr("y2", this.innerHeight);
        
        if (this._options.type != "bar") {
            const dots = g.selectAll("circle")
                  .data(data.slice(1))
                  .join("circle")
            // .style("fill", d => this.isSparkline ? this._options.sparkline["circle-color"] : this.color(d[this._options.category.name]))
                  .style("fill", d => this._options.style.tooltipDotColor(d))
                  .attr("r", this._options.style.tooltipDotSize)
                  .attr("cx", (d, i) => this.x(d[this._options.x.name]))
                  .attr("cy", (d, i) => this.y(d[this._options.y.name]));
        }
        
        
        // background of tooltip
        const path = g.selectAll("rect")
              .data([null])
              .join("rect")
              .attr("class","rect_tooltip")
              .attr("style",`fill:${this._options.style.tooltipBackgroundColor}; fill-opacity: ${this._options.style.tooltipOpacity};`);

        // Tooltip text
        let text = g.selectAll("text")
            .data([null])
            .join("text")
            .call(text => text
                  .selectAll('tspan')
                  .data(data.slice(1))
                  .join("tspan")
                  .attr("x", 0)
                  .attr("y", (d, i) => `${i * 1.1}em`)
                  .attr("class","tooltip_text")
                  .style("fill",(d, i) => this._options.style.tooltipColor)
                  .text((d,i) => `${this._options.y.tickFormat(d[this._options.y.name])}`)
                  .attr('style', `font-size:${this._options.sparkline.textFontSize};`));
        const {xx, yy, width: w, height: h} = text.node().getBBox();

        // Make sure the tooltip is always in the graph area (and visible)
        let text_x = w + mouseX > this.svgWidth ? mouseX - w : mouseX,
            text_y = mouseY - 5 < 0 ? mouseY + 5 : mouseY + h > this.innerHeight ? this.innerHeight - h : mouseY;
        text.attr("transform", `translate(${text_x},${text_y})`);
        // Rectangle around text for tooltip
        path.attr("x", text_x)
            .attr("y", text_y - 11)
            .attr("rx", 5)
            .attr("width", w )
            .attr("height", h); 
        return true;
    }
    
    /**
     * Get and sets the values of the inner margins
     * @name margin
     * @param {Object} margin
     * @param {string} [margin.top=10] - margin top
     * @param {string|function} [margin.right=(x) => x < 400 ? 20 : 30] - margin right depends of the width of the graph
     * @param {string} margin.bottom - margin bottom
     * @param {string|function} [margin.left=(x) => x < 400 ? 40 : 60] - margin left depends of the width of the graph
     * @return {Object}
     * @instance 
     * @memberof Grapher
     */
    get margin() {
        return this._margin;
    }
    set margin({top=10,
                right=((x) => x < 400 ? 20 : 30),
                bottom,
                left=(x) => x < 400 ? 40 : 60}={}){
        this._margin = {"top": 0, "right": 0, "bottom": 0, "left": 0};
        this._innerDimensions();
    }
        
}

export { Sparkline };
