import { GrapherBase } from "./base.js";
import { updateDict, unique, findTimeFormat, splitString } from "./utils.js";
import { colorPalette } from "./defaults.js";

/**
 * The `Chart` object represents the graph.
 *
 * You create a `Chart` by specifying a `container` (a DOM element)
 * that will contain the graph, and other options.
 *
 *
 * @class Chart
 * @param {string} id of the DOM element
 * @param {Object} options Set of options for the graph. 
 * @param {Array<Object>} [options.data=[]] Array of JSON containing the data
 * @param {Object} options.x - Set of options for the x axis
 * @param {string} [options.x.name=x] Name of the x-axis variable in options.data
 * @param {string} [options.x.scale="scaleLinear"] - d3-scale, see {@link https://github.com/d3/d3-scale|d3-scale on Github}
 * @param {function|null} [options.x.parse=null] - Function to parse the data (useful if x-axis is a date)
 * @param {function|null} [options.x.tickFormat=null] - Function to format the variable when displayed as tick or in tooltip
 * @param {string|null} [options.x.label=null] - Label for x-axis
 * @param {Array<number>|null} [options.x.domain=null] - Hardcode the x-axis bound. 
 * Default is to use min and max of x values in options.data
 * @param {Boolean} [options.x.nice=true] - Extends the domain so that it starts and ends on nice round values (applying d3.nice()), for further reference see {@link https://github.com/d3/d3-scale#continuous_nice|d3-scale on Github}
 * @param {Object} options.y - Set of options for the y axis
 * @param {string} [options.y.name=x] name of the y-axis variable in options.data
 * @param {string} [options.y.scale="scaleLinear"] d3-scale, see {@link https://github.com/d3/d3-scale|d3-scale on Github}
 * @param {function|null} [options.y.parse=null] function to parse the data (useful if y-axis is a date)
 * @param {function|null} [options.y.tickFormat=null] function to format the variable when displayed as tick or in tooltip
 * @param {string|null} [options.y.label=null] label for y-axis
 * @param {Array<number>|null} [options.y.domain=null] Hardcode the y-axis bound. Default is to use min and max of y values in options.data
 * @param {Boolean} [options.y.nice=true] - Extends the domain so that it starts and ends on nice round values (applying d3.nice()), for further reference see {@link https://github.com/d3/d3-scale#continuous_nice|d3-scale on Github}
 * @param {Object} options.category set of options for category
 * @param {string|null} [options.category.name=null] name of the category variable in options.data
 * @param {function} [options.category.parse=(d => d)] function to parse (or format) the category variable when displayed in tooltip
 * @param {Array<string>|Boolean} [options.categories=false] - Hardcode the list of elements of the 'category' variable to select only data's elements belonging to this list. When no list is specified, the list of elements is derived from the data and all 'category' values found in the data are considered.
 * @param {string} [options.type="line"] type of the graph. Possible types are "line", "bar", "dotted-line", "dot", "sparkline"
 * @param {Object} options.style list of options for styling the elements of the graph
 * @param {Array<string>} options.style.colors List of colors for the lines, bars, dots (not applicable for sparkline).
 *    Default is ["#1abb9b","#3497da","#9a59b5","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"]
 * @param {number} [options.style.barWidth=0.8] Share of the x axis width that should be filled with bars. Setting to 0.8, lets 20% in space between bars.
 * @param {number} [options.style.strokeWidth=3] - stroke-width of the line. Default is 3px
 * @param {number} [options.style.dotSize=4] - dot-size of the dots. Default is 4px 
 * @param {string} [options.style.tooltipColor="#181818"] - Text color in the tooltip
 * @param {string} [options.style.tooltipBackgroundColor="#ffffff"] - Background color of the tooltip
 * @param {string} [options.style.tooltipOpacity="0.8"] - Opacity of the tooltip. Default is 0.8 (80%)
 * @param {string} [options.style.tooltipLineColor="#000000"] - Color of the vertical line color
 * @param {string|function} [options.style.beautifyClosestLine="widen"] - Beautify the closest line to current mouse cursor (only works for line or dotted-lines). Possible options are either "widen" (increase the stroke-width by 1), "color" (color the closest line, grayed the others) or you can pass a function that will be applied on every lines and takes four parameters: the element itself, whether the line is the closest, the path and the category.
 * @param {Object} options.grid - Options for the grid
 * @param {Object} options.grid.x - Options for grid on the x-axis
 * @param {Boolean} [options.grid.x.show=false] - if true, grid will be added (same frequency as ticks)
 * @param {{x:string, label: string, position:string, y: string, textAnchor: string, class: string}[]} [options.grid.x.lines=[]] - Array for vertical lines. For each line, you should at least specify the position on the x-axis (same format as x axis). You can add a label for which you can specify its position by choosing 'position' value among 'start', 'middle', 'end'. The label can also be more precisely positionned by specifying a 'y' and textAnchor value among 'start', 'middle', 'end'. You can also add a class with 'class'.
 * @param {Object} options.grid.y - Options for grid on the y-axis
 * @param {Boolean} [options.grid.y.show=true] - if true, grid will be added (same frequency as ticks)
 * @param {{y:string, label: string, position:string, x: string, textAnchor: string, class: string}[]} [options.grid.y.lines=[]] - Array for horizontal lines. For each line, you should at least specify the position on the y-axis (same format as y axis). You can add a label for which you can specify its position by choosing 'position' value among 'start', 'middle', 'end'. The label can also be more precisely positionned by specifying a 'x' and textAnchor value among 'start', 'middle', 'end'. You can also add a class with 'class'.
 * @param {Object} options.legend - Options for the legend 
 * @param {Boolean} [options.legend.show=true] - show legend. If false, legend will not be displayed.
 * @param {number} [options.legend.x=15] - legend's x position in the svg 
 * @param {number} options.legend.y - legend's y position in the svg. Default value equals the margin-top of the g element inside the svg.
 * @param {number} [options.legend.interstice=25] - space in px between the legend items
 * @param {string} [options.legend.backgroundColor="#ffffff"] - legend's background color 
 * @param {string} [options.legend.opacity="0.9"] - opacity of the legend
 * @param {Object} options.download - options for downloading data associated with the graph
 * @param {string} [options.filename="data_<elementId>_<date>.csv"] - filename for the csv linked to the data
 * @param {Object} options.sparkline - options for the sparkline object
 * @param {Array<number>|null} [options.sparkline.range=null] - range for the background's 
 *   band displayed in the sparkline. If null, not the band is not displayed.
 * @param {Boolean} [options.sparkline.textLastPoint=true] - display the last point's value as adjacent text.
 * @param {number} [options.sparkline.strokeWidth=1] - stroke's width of the sparkline
 * @param {string} [options.sparkline.lineColor="#000000"] - line's color of the sparkline
 * @param {string} [options.sparkline.circleColor="#f00"] - circle's color for the last point of the sparkline
 * @param {string} [options.sparkline.textColor="#f00"] - text's color of the last point value displayed next to the sparkline
 * @param {string} [options.sparkline.textFontSize="85%"] - text's font size
 * @param {string} [options.sparkline.textFontWeight="600"] - text's font weight
 * @param {string} [options.sparkline.rangeFillColor="#ccc"] - range's band fill color
 * @param {Object} options.advanced - Advanced options
 * @param {Array<string>} [options.advanced.additionalColumnsInData=[]] - Grapher will only keep x, y and category when parsing the data. Passing columns names here will preserve them in the data.
 * @param {string} [options.sparkline.rangeFillColor="#ccc"] - range's band fill color
 * @param {number} [width=null] width of the DOM element (if not already setup in HTML or CSS)
 * @param {number} [height=null] height of the DOM element (if not already setup in HTML or CSS)
 *
 * @example 
 * let myGraphExample1 = new Grapher('myGraphExample1',
 *                                 {"data": data,
 *                                  "x": {
 *                                      "name": "date",
 *                                       "scale": "scaleTime",
 *                                       "parse": (d) => d3.timeParse('%Y-%m-%d')(d),
 *                                       "tickFormat": d3.timeFormat("%d/%m/%y"),
 *                                       "label": "Date"
 *                                   },
 *                                   "y": {
 *                                       "name": "value",
 *                                       "tickFormat": d3.format('.3s'),
 *                                       "label": "Glucose"
 *                                   },
 *                                   "type": "dotted-line",
 *                                   });
 */
class Chart extends GrapherBase {
    constructor(id, type = "line", options = {}, width = null, height = null) {
        super(id, type, width, height);
        
        // Set default options and update with options pass by user
        this._options = this._defaultOptions();
        
        // Update options
        this.options = options;

        // Check if type is sparkline
        this.isSparkline = this.type.includes("sparkline");
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
        this._margin = {"top": top,
                            "right": typeof right == "function" ? right(this.svgWidth) : right,
                            "bottom": bottom || this._style.fontSize*2 + 20,
                            "left": typeof left == "function" ? left(this.svgWidth) : left};
        this._innerDimensions();
    }

    // Setting inner dimension (without axes)
    _innerDimensions() {
        this.innerWidth = this.svgWidth - this._margin.left - this._margin.right;
        this.innerHeight = this.svgHeight - this._margin.top - this._margin.bottom;

        this._createSVG();
    };

    // Creating the svg
    _createSVG() {
        this.svg.select(`#${this.id}_g`).remove();
        this.g = this.svg.append("g")
            .attr('id', this.id + '_g')
            .attr('transform', `translate(${this._margin.left},${this._margin.top})`);

        this._addOverlay();
    };

    // Add overlay for focus & tooltip
    _addOverlay() {
        this.g.append("rect")
            .attr("class", "overlay")
            .attr("fill","none")
            .attr("style","pointer-events:all;")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight);
    };


    /** 
     * Gets and sets the option for `Grapher` object. 
     * Note that setter is called only by `typing myGraph.options = {something};` 
     * Typing myGraph.options.data = something; do work but setter is not called and data is not parsed again, etc.
     * @name options
     * @param {Object} options @link Grapher
     * @instance
     * @memberof Grapher
     */
    get options () {
        return this._options;
    }
    set options(opt) {
        updateDict(this._options, opt);

        // No category is specified, we derive it from y label / name
        if (! opt.category && ! this._options.category.name) {
            this._options._categories = [this._options.y.label] || [this._options.y.name];
        } else if ( ! this._options.categories && this._options.category.name) {
            // When no list of categories is user-defined, we derive it from the data
            this._options._categories = unique(this._options.data.map(d => d[this._options.category.name]));
        } else {
            this._options._categories = this._options.categories;
        }
        
        // if user forgot to specify scaleTime while parsing a date
        if (opt.x && ! opt.x.scale && opt.x.parse && opt.x.parse.toString().match(/(d3.timeParse|new Date)/g)) {
            this._options.x.scale = "scaleTime";
        }
        if (opt.y && ! opt.y.scale && opt.y.parse && opt.y.parse.toString().match(/(d3.timeParse|new Date)/g)) {
            this._options.y.scale = "scaleTime";
        }

        // If user don't specify a tickFormat while using d3.timeParse, use the format arg of d3.timeParse for tickFormat
        if (opt.x && ! opt.x.tickFormat && opt.x.parse && opt.x.parse.toString().includes('d3.timeParse')) {
            this._options.x.tickFormat = d3.timeFormat(findTimeFormat(opt.x.parse.toString()));
        }
        if (opt.y && ! opt.y.tickFormat && opt.y.parse && opt.y.parse.toString().includes('d3.timeParse')) {
            this._options.y.tickFormat = d3.timeFormat(findTimeFormat(opt.y.parse.toString()));
        }
        
        // Defines color function
        this.color = d3.scaleOrdinal()
            .domain(this._options._categories)
            .range(this._options.style.colors);

        // Finally, parse data (if required);
        if (! this.data || opt.data || (opt.x && opt.x.parse) || (opt.y && opt.y.parse) || opt.categories) {
            this._parseData();
        }
        // set margins
        this.margin = {left:(this._options.y.label ? 80 : 60), bottom: (this._options.x.label ? this._style.fontSize*2 + 20 : 40)};

        // // Copy some sparkline config to style
        if (this.isSparkline) {
            this._options.style.strokeWidth = this._options.sparkline.strokeWidth;
        }
    }
    _parseData() {
        if (this._options.x.parse || this._options.y.parse || this._options.categories.length > 0) {
            let data = [],
                filterByCategory = this._options.category.name && this._options.categories.length > 0;
            for (const d of this._options.data) {
                if (! filterByCategory || this._options.categories.indexOf(d[this._options.category.name]) > -1) {
                    let _ = {};
                    _[this._options.x.name] = this._options.x.parse ? this._options.x.parse(d[this._options.x.name]) : d[this._options.x.name];
                    _[this._options.y.name] = this._options.y.parse ? this._options.y.parse(d[this._options.y.name]) : d[this._options.y.name];
                    if (this._options.category.name) {
                        _[this._options.category.name] =  d[this._options.category.name];
                    } else {
                        _['category'] = this._options.y.label || this._options.y.name;
                    }
                    for (const c of this._options.advanced.additionalColumnsInData) {
                        _[c] = d[c];
                    }
                    data.push(_);
                }
            }
            this.data = data;
            // update category name in case not set
            this._options.category.name = this._options.category.name || 'category';
        } else {
            this.data = JSON.parse(JSON.stringify(this._options.data));
        }
    }

    extent(variable, scale, enforceMinimumAt0=false, data=this.data) {
        if (scale == "scaleLog") {
            let min = d3.min(data.filter(d => d[variable] > 0), d => d[variable]),
                max = d3.max(data, d => d[variable]);
            return [min, max];
        } else {
            if (enforceMinimumAt0) {
                // in case of bar, enforce that mininum is set at 0
                return [Math.min(d3.min(data, d => d[variable]),0), d3.max(data, d => d[variable])];
            } else {
                return d3.extent(data, d => d[variable]);
            }
        }
    }

    // Drawing methods
    // ===============
    /**
     * Draw the Grapher object
     * @param {Object|null} options - you can pass an options Object to update the element's option. @link Grapher
     */
    draw(options) {
        if (options) {
            this.options = options;
        }
        // Clean
        this.g.selectAll('g.x.axis').remove();
        this.g.selectAll('g.y.axis').remove();
        this.g.selectAll('g.yGrid').remove();
        
        // Add axis & grid
        this._addX();
        if (this._options.type == "bar") {
            this._addX2();
        }
        if (this._options.x.label) {
            this._addXLabel();
        }
        this._addY();
        if (this._options.y.label) {
            this._addYLabel();
        }
        
        if (this._options.grid.y.lines.length > 0) {
            this._addYGridLines();
        }
        if (this._options.grid.x.lines.length > 0) {
            this._addXGridLines();
        }
        
        // Add content      
        this._draw();

        // Add tooltip & legend
        this._addTooltip();
        if (this._options.legend.show) {
            this._addLegend();
        }
    }


    // Graph internal methods
    // =======================
    _defaultOptions() {
        return {
            "data": [],
            "x": {
                "name": "x",
                "scale": "scaleLinear",
                "tickFormat": d3.format('.3s'),
                "parse": null,
                "label": null,
                "domain": null,
                "nice": false
            },
            "y": {
                "name": "y",
                "scale": "scaleLinear",
                "tickFormat": d3.format('.3s'),
                "parse": null,
                "label": null,
                "domain": null,
                "nice": true
            },
            "category": {
                "name": null,
                "parse": d => d
            },
            "categories": false,
            "type": "line",
            "style": {
                "colors": colorPalette,
                "barWidth": 0.8,
                "strokeWidth": 3,
                "dotSize": 4,
                "grid": true,
                "tooltipColor": this._style.color,
                "tooltipBackgroundColor": this._style.backgroundColor,
                "tooltipOpacity": "0.8",
                "tooltipLineColor": this._style.color,
                "tooltipFormat": ((d,i) => i === 0 ?
                                  this._options.x.tickFormat(d) :
                                  `${this._options.category.parse(d[this._options.category.name])}: ${this._options.y.tickFormat(d[this._options.y.name]) || d3.format('.3s')(d[this._options.y.name])}`),
                "tooltipDotColor": ((d) => this.color(d[this._options.category.name])),
                "tooltipDotSize": 5,
                "beautifyClosestLine": "widen"
            },
            "legend": {
                "show": true,
                "x": 15, 
                "y": this._margin.top,
                "interstice": 25, // distance between dots
                "backgroundColor": this._style.backgroundColor,
                "opacity": "0.9"
            },
            "download": {
                "filename": `data_${this.id}_${Date.now()}.csv`
            },
            "grid": {
                "x": {
                    "show": false,
                    "lines": []
                },
                "y":{
                    "show": true,
                    "lines": []
                }
            },
            "advanced": {
                "additionalColumnsInData": []
            }
        };
    }
    _style(element, styleAttr, styleValue) {
        let style = element
            .attr('style')
            .split(';')
            .filter(d => d.length > 0)
            .map(d => d.replace(' ','').split(':'))
            .reduce((d, [k, v]) => {d[k] = v; return d;},{});
        style[styleAttr] = styleValue;
        element.attr('style', Object.entries(style).map(d => d.join(":")).join(";"));
        return style;
    }
    _addX() {
        // (i) Find the width
        this.xValues = unique(this.data.map(d => d[this._options.x.name]));
        this.xNbValues = this.xValues.length;
        this.xWidth = this.innerWidth / this.xNbValues;
        this.xRange = this._options.type == "bar" ? [this.xWidth/2, this.innerWidth - this.xWidth/2] : [0, this.innerWidth];
        this.xNbTicks = d3.min([parseInt((this.svgWidth - 100) / 100), this.xNbValues]);
        this.x = d3[this._options.x.scale]()
            .domain((this._options.x.domain ? this._options.x.domain : this.extent(this._options.x.name, this._options.x.scale)))
            .range(this.xRange);

        if (this._options.x.nice) {
            this.x = this.x.nice();
        }

        // add X axis to svg
        this.g.append("g")
            .attr("class","x axis")
            .attr("transform",`translate(0, ${this.innerHeight})`)
            .call(d3.axisBottom(this.x)
                  .ticks(this.xNbTicks)
                  .tickFormat(this._options.x.tickFormat)
                 );
        // in case of bars, x-axis doesn't fill the width
        if (this._options.type == "bar") {
            this.g.append("g")
                .attr("class","x axis")
                .attr("transform", `translate(0, ${this.innerHeight + 0.5})`)
                .attr("opacity","1")
                .append('line')
                .attr('stroke','currentColor')
                .attr('x2', this.innerWidth);
        }
        if (this._options.grid.x.show) {
            this._addXGrid();
        }
    }
    _addXLabel() {
        this.g.append("text")
            .attr("class","xLabel axisLabel")
            .attr("transform", `translate(${this.innerWidth/2},${this.svgHeight-this._margin.bottom/2})`)
            .style("text-anchor","middle")
            .style("fill", this._style.color)
            .text(this._options.x.label);
    };

    _addX2() {
        // Second X-axis in case of bars
        this.x2 = d3.scaleBand()
            .domain(this._options._categories)
            .rangeRound([-this.xWidth/2*this._options.style.barWidth, this.xWidth/2*this._options.style.barWidth]);
    }

    _addY() {
        this.yVar = this._options.y.name;
        
        // Define Y Axis
        this.y = d3[this._options.y.scale]()
            .domain(this._options.y.domain ? this._options.y.domain : this.extent(this._options.y.name, this._options.y.scale, this._options.type == "bar"))
            .range([this.innerHeight, 0]);

        if (this._options.y.nice) {
            this.y = this.y.nice();
        }

        // Add Y axis to svg
        this.g.append("g")
            .attr('class','y axis')
            .call(d3.axisLeft(this.y)
                  .tickFormat(this._options.y.tickFormat));
        // Define Y grid
        if (this._options.grid.y.show) {
            this._addYGrid();
        }
        // Add horizontal line at X = 0
        if (this.y.domain()[0] < 0 && this._options.type == "bar") {
            this.g.append("g")
                .attr("class","x axis")
                .attr("transform", `translate(0, ${this.y(0)})`)
                .attr("opacity","1")
                .append('line')
                .attr('stroke','currentColor')
                .attr('x2', this.innerWidth);
        }
    }
    _addYGrid() {
        // Find best number of ticks
        this.yNbTicks = this._options.y.scale == "scaleLog" ? Math.round(Math.log10(this.y.domain()[1]) - Math.log10(this.y.domain()[0])): parseInt(this.innerHeight / 40);
        
        // Define Y grid
        this.yGrid = svg => svg
            .call(d3.axisRight(this.y)
                  .ticks(this.yNbTicks)
                  .tickSize(this.innerWidth)
                  .tickFormat(this._options.y.tickFormat))
            .call(g => g.selectAll('.domain').remove())
            .call(g => g.selectAll(".tick:not(:first-of-type) line")
                  .attr("stroke-opacity", 0.5)
                  .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick:first-of-type line").remove())
            .call(g => g.selectAll(".tick text")
                  .remove())
            .call(g => g.selectAll(".tick line")
                  .attr('class','y-grid'));
        // Add Y-Grid to svg
        this.g.append("g")
            .attr('class','yGrid')
            .call(this.yGrid);
    }
    _addXGrid() {
        // Define X grid
        this.xGrid = svg => svg
            .call(d3.axisBottom(this.x)
                  .tickSize(this.innerHeight)
                  .ticks(this.xNbTicks)
                  .tickFormat(this._options.x.tickFormat))
            .call(g => g.selectAll('.domain').remove())
            .call(g => g.selectAll(".tick:not(:first-of-type) line")
                  .attr("stroke-opacity", 0.5)
                  .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick:first-of-type line").remove())
            .call(g => g.selectAll(".tick text")
                  .remove())
            .call(g => g.selectAll(".tick line")
                  .attr('class','x-grid'));
        // Add Y-Grid to svg
        this.g.append("g")
            .attr('class','xGrid')
            .call(this.xGrid);
    }
    _addYGridLines() {
        for (const line of this._options.grid.y.lines) {
            this.g.append("g")
                .attr("class",`y grid-line ${line.class || ""}`)
                .attr("transform", `translate(0, ${this.y(line.y)})`)
                .attr("opacity","1")
                .append('line')
                .attr("class",`${line.class || ""}`)
                .attr('stroke','currentColor')
                .attr('x2', this.innerWidth);
            if (line.label) {
                line.textAnchor = line.textAnchor || (line.position || "middle");
                line.xox = this.x(line.x) || (line.position ? line.position == "middle" ? this.innerWidth/2 : line.position == "start" ? this.margin.left : this.innerWidth - this.margin.right : this.margin.left);
                this.g.append("text")
                    .attr("y", this.y(line.y))
                    .attr("x", line.xox)
                    .attr("dy", "1em")
                    .attr("class",`grid-line-label ${line.class || ""}`)
                    .attr("style","font-size:0.8rem")
                    .style("text-anchor", line.textAnchor)
                    .style("fill", this._style.color)
                    .text(line.label);
            }
        }
    }
    _addXGridLines() {
        for (const line of this._options.grid.x.lines) {
            this.g.append("g")
                .attr("class",`x grid-line ${line.class || ""}`)
                .attr("transform", `translate(${this.x(line.x)}, 0)`)
                .attr("opacity","1")
                .append('line')
                .attr("class",`${line.class || ""}`)
                .attr('stroke','currentColor')
                .attr('y2', this.innerHeight);
            if (line.label) {
                line.textAnchor = line.textAnchor || (line.position || "middle");
                line.yoy = this.y(line.y) || (line.position ? line.position == "middle" ? this.innerHeight/2 : line.position == "start" ? this.innerHeight - this.margin.top : this.margin.top : this.margin.top);
                this.g.append("text")
                    .attr("transform", `rotate(-90,${this.x(line.x)},${line.yoy})`)
                    .attr("y", line.yoy)
                    .attr("x", this.x(line.x))
                    .attr("dy", "1em")
                    .attr("class",`grid-line-label ${line.class || ""}`)
                    .attr("style","font-size:0.8rem")
                    .style("text-anchor", line.textAnchor)
                    .style("fill", this._style.color)
                    .text(line.label);
            }
        }
    }
    _addYLabel() {
        // Add Title for X axis
        this.g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this._margin.left)
            .attr("x",0 - (this.innerHeight / 2))
            .attr("dy", "1em")
            .attr("class","yLabel axisLabel")
            .style("text-anchor", "middle")
            .style("fill", this._style.color)
            .text(this._options.y.label);   
    }
    _draw() {
        this.g.selectAll('path.lines').remove();
        this.g.selectAll(`rect.bar`).remove();
        this.g.selectAll(`circle.dots`).remove();
        this._paths = {};
        for (const category of this._options._categories) {
            if (['line','dotted-line'].indexOf(this._options.type) > -1) {
                this._paths[category] = this.g.append('path')
                    .datum(this.data.filter(d => d[this._options.category.name] === category))
                    .attr('class','lines')
                    .attr('fill', 'none')
                    .attr('stroke', d => this.color(category))
                    .attr('stroke-width', this._options.style.strokeWidth)
                    .attr('d', d3.line()
                          .y(d => this.y(d[this._options.y.name]))
                          .defined(d => d[this._options.y.name])
                          .x(d => this.x(d[this._options.x.name])));
            };
            if (this._options.type == "bar") {
                if (this.x2.bandwidth() > 0) {
                    this.g.selectAll(`rect.bar.${category.replace(/[^a-z0-9A-Z]/g,'')}`)
                        .data(this.data.filter(d => d[this._options.category.name] === category))
                        .join('rect')
                        .attr('class', `bar ${category.replace(/[^a-z0-9A-Z]/g,'')}`)
                        .attr('fill',  d => this.color(category))
                        .attr('x', d => this.x(d[this._options.x.name]) + this.x2(category))
                        .attr('width', this.x2.bandwidth())
                        .attr('y', d => d[this._options.y.name] > 0 ? this.y(d[this._options.y.name]) : this.y(0))
                        .attr('height', d => Math.abs((this.y(0) || this.y(this.y.domain()[0])) - this.y(d[this._options.y.name])))
                        .on("mouseover", function(d) {
	                    d3.select(this).attr("fill", function() {
                                return d3.rgb(d3.select(this).style("fill")).darker(0.5);
                            });
                        })
                        .on("mouseout", function(d) {
	                    d3.select(this).attr("fill", function() {
                                return d3.rgb(d3.select(this).style("fill")).brighter(0.5);
                            });
                        });
                }
            };
        };
        if (['dotted-line','dot'].indexOf(this._options.type) > -1) {
            this.g.selectAll("circle")
                .data(this.data)
                .join("circle")
                .style("fill", d => this.color(d[this._options.category.name]))
                .attr("class","dots")
                .attr("r", this._options.style.dotSize)
                .attr("cx", (d, i) => this.x(d[this._options.x.name]))
                .attr("cy", (d, i) => this.y(d[this._options.y.name]));
        };

        if (this._options.type == "bar" && this.x2.bandwidth() < 1) {
            // Create an alert
            let alertBarZeroWidth = this.g.append("g")
                .attr('class','alert_barzerowidth')
                .attr('x',10)
                .attr('y',10);
            let textAlert = "WARNING: Graph cannot be plotted because there are too many bars to be displayed compare to the available width.",
                textAlertA = splitString(textAlert,Math.floor(this.innerWidth / this._style.fontSize));
            alertBarZeroWidth.selectAll("rect.alert_barzerowidth")
                .data([null])
                .join("rect")
                .attr("class","alert_barzerowidth")
                .attr("style",`fill:${this._options.style.tooltipBackgroundColor}; fill-opacity: ${this._options.style.tooltipOpacity};`);
            alertBarZeroWidth.selectAll("text.alert_barzerowidth")
                .data([null])
                .join("text")
                .call(text => text
                      .selectAll('tspan')
                      .data(textAlertA)
                      .join("tspan")
                      .attr("x", 20)
                      .attr("y", (d, i) => `${this.innerHeight / 2 + (i-textAlertA.length/2)* 1.1 * this._style.fontSize}px`)
                      .attr("class","tooltip_text")
                      .style("font-weight","bold")
                      .style("font-size","1em")
                      .style("fill", "red")
                      .text((d,i) => d));
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
                  .data(data)
                  .join("tspan")
                  .attr("x", 0)
                  .attr("y", (d, i) => `${i * 1.1}em`)
                  .attr("class","tooltip_text")
                  .style("font-weight","bold")
                  .style("fill",(d, i) => i === 0 ? (typeof this._options.style.tooltipColor == "function" ? this._options.style.tooltipColor() : this._options.style.tooltipColor) : this.color(d[this._options.category.name]))
                  .text((d,i) => this._options.style.tooltipFormat(d,i)));

        const {xx, yy, width: w, height: h} = text.node().getBBox();

        // Make sure the tooltip is always in the graph area (and visible)
        let text_x = w + mouseX + 10 > this.innerWidth ? mouseX - w - 10 : mouseX + 10,
            text_y = mouseY - 20 < 0 ? mouseY + 20 : mouseY + h - 10 > this.innerHeight ? this.innerHeight - h + 10: mouseY;
        text.attr("transform", `translate(${text_x},${text_y})`);
        
        // Rectangle around text for tooltip
        path.attr("x", text_x - 5)
            .attr("y", text_y - 20)
            .attr("rx", 5)
            .attr("width", w + 10)
            .attr("height", h + 10);

        return true;
    }
    _getMouseData(mouseX) {
        let mouseXValue_ = this.x.invert(mouseX), // mouse value projection on X axis
            mouseIndex = d3.bisector(d => d).left(this.xValues, mouseXValue_), // mouse index on X axis
            a = mouseIndex > 0 ? this.xValues[mouseIndex - 1] : 0,
            b = mouseIndex > this.xValues.length - 1 ? this.xValues.slice(-1)[0] : this.xValues[mouseIndex];
        // We get value before mouseIndex and at mouseIndex to find out to which value mouse is the closest;

        let mouseXValue = mouseXValue_ - a > b - mouseXValue_ ? b : a,
            mouseYValues = this.data.filter(d => d[this._options.x.name].toString() == mouseXValue.toString())
            .sort((a,b) => b[this._options.y.name] - a[this._options.y.name]);
        return [mouseXValue].concat(mouseYValues);
    }
    _widenClosestLine(mouseData, mouse_y) {
        if (this.hasOwnProperty('_paths') && this._options.style.widenClosestLine) {
            let closestCategoryAtPoint = null;
            if (mouseData) {
                closestCategoryAtPoint = mouseData.slice(1).sort(
                    (a, b) => (Math.abs(a[this._options.y.name]- mouse_y))
                        -Math.abs(b[this._options.y.name]- mouse_y))[0]
                [this._options.category.name];
            }
            for (const [category, path] of Object.entries(this._paths)) {
                if (category === closestCategoryAtPoint) {
                    path.attr('stroke-width', this._options.style.strokeWidth + 1);
                    if (this.isSparkline && this._options.sparkline.textLastPoint) {
                        this._style(this._sparkTextLastPoints[category], "display","inline-block");
                        this._style(this._sparkTextYLabels[category], "display","inline-block");
                    }
                } else {
                    path.attr('stroke-width', this._options.style.strokeWidth);
                    if (this.isSparkline && this._options.sparkline.textLastPoint) {
                        this._style(this._sparkTextLastPoints[category], "display","none");
                        this._style(this._sparkTextYLabels[category], "display","none");
                    }
                }
            }
        }
    }
    _beautifyClosestLine(mouseData, mouse_y, beautifyFunction = null) {
        if (beautifyFunction === "widen" ) {
            beautifyFunction = this._widenClosestLine;
        } else if (beautifyFunction === "color") {
            beautifyFunction = this._colorClosestLine;
        }
        if (this.hasOwnProperty('_paths') && beautifyFunction) {
            let closestCategoryAtPoint = null;
            if (mouseData) {
                closestCategoryAtPoint = mouseData.slice(1).sort(
                    (a, b) => (Math.abs(a[this._options.y.name]- mouse_y))
                        -Math.abs(b[this._options.y.name]- mouse_y))[0]
                [this._options.category.name];
            }
            for (const [category, path] of Object.entries(this._paths)) {
                beautifyFunction(this,
                                 category === closestCategoryAtPoint,
                                 path,
                                 category);
            }
        }
    }
    _widenClosestLine(el, on_off, path, category) {
        if (on_off) {
            path.attr('stroke-width', el._options.style.strokeWidth + 1);
        } else {
            path.attr('stroke-width', el._options.style.strokeWidth);
        }
    }
    _colorClosestLine(el, on_off, path, category) {
        if (on_off) {
            path.attr('stroke', d => el.color(category));
        } else {
            path.attr('stroke', d => "#ccc");
        }
    }
    _addTooltip() {
        this.g.selectAll("g.tooltip_container").remove();
        this.tooltip = this.g.append("g").attr("class","tooltip_container");
        let that = this;
        this.g.on("touchmove mousemove", (event) => {
            let mouse_x = d3.pointer(event)[0],
                mouse_y = d3.pointer(event)[1];
            if (mouse_x > 0) {
                let mouseData = that._getMouseData(mouse_x);
                that._buildTooltip(that.tooltip, mouseData, that.x(mouseData[0]), mouse_y);
                that._beautifyClosestLine(mouseData, that.y.invert(mouse_y), this._options.style.beautifyClosestLine);
            }
        });
        this.g.on("touchend mouseleave", () => {
            this.tooltip.call(this._buildTooltip, null);
            this._beautifyClosestLine(null, null);
        });
    }

    _addLegend() {
        this.g.selectAll('.legend').remove();
        this.legend = this.g.append('g').attr('class','legend');
        this.legendBackground = this.legend.selectAll('rect')
            .data([null])
            .join("rect")
            .attr("class", "rect_legend")
            .attr("style",`fill:${this._options.legend.backgroundColor}; fill-opacity: ${this._options.legend.opacity};`);
        
        this.legendDots = this.legend.selectAll(".dots-legend")
            .data(this._options._categories);
        this.legendDots.exit().remove();
        this.legendDots.enter()
            .append("circle")
            .merge(this.legendDots)
            .attr("cx", this._options.legend.x + 10)
            .attr("cy", (d,i) => this._options.legend.y + i * this._options.legend.interstice)
            .attr("r", 3)
            .attr('class','dots-legend')
            .style("fill",d => this.color(d));

        // Add one dot in the legend for each name.
        this.legendLabels = this.legend.selectAll(".labels-legend")
            .data(this._options._categories);
        this.legendLabels.exit().remove();
        this.legendLabels.enter()
            .append("text")
            .merge(this.legendLabels)
            .attr("x", this._options.legend.x + 30)
            .attr("y", (d,i) => this._options.legend.y + i * this._options.legend.interstice)
            .style("fill", d => this.color(d))
            .text(t => this._options.category.parse(t))
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .attr('class','labels-legend');

        let x, y, w, h;
        try {
            let _ = this.legend.node().getBBox();
            x = _.x,
            y = _.y,
            w = _.width,
            h = _.height;
        } catch(err) {
            x = 85,
            y = 5,
            w = 0,
            h = 0;
        }
        this.legendBackground.attr('x', this._options.legend.x-5)
            .attr('y',this._options.legend.y-10)
            .attr('width', (w > 0 ? w + 20 : d3.max(this._options._categories.map(d => d.length))*10 + 10)) // if graph is not displayed the width and height will be zero (*)
            .attr('height',(h > 0 ?  h + 10 : this._options._categories.length * this._options.legend.interstice + 10));
        // (*) we try to estimate the width and height based on max
        //     nb of characthers of the legend text and nb of keys
        
    }
}

export { Chart };
