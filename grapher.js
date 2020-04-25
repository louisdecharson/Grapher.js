/* 
 * Grapher - Tiny wrapper around D3.js for line and bar charts
 * @copyright Louis de Charsonville 2020
 */


/**
 * The `Grapher` object represents the graph.
 *
 * You create a `Grapher` by specifying a `container` (a DOM element)
 *  that will contain the graph, and other options.
 *
 *
 * @class Grapher
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
 * @param {Array<string>} [options.categories=[]] hardcode the list of elements of the 'category' variable. 
 *   Default is to take all unique values in options.data
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
class Grapher {
    constructor(id, options = {}, width = null, height = null) {
        this.id = id;
        this.el = document.getElementById(this.id);

        // Setting width and height
        this.width =  width || this.el.offsetWidth;
        this.height = height || this.el.offsetHeight;

        // Find font size of the element
        this._fontSize = parseFloat(window.getComputedStyle(this.el).fontSize);

        // Add a container for the graph
        this.container = d3.select(`#${this.id}`)
            .append('span')
            .attr('class','grapherContainer');

        // Add svg
        this.svg = this.container
            .append("svg")
            .attr("id", this.id + '_svg')
            .attr('class','grapher')
            .attr("width", this.width)
            .attr("height", this.height);

        // Check if options set to sparkline
        if (options.type != undefined &&
            options.type == "sparkline") {
            this.isSparkline = true;
        } else {
            this.isSparkline = false;
        }

        // Create margins
        this._margin = {};
        this.margin = {};

        // Set default options and update with options pass by user
        this._options = {
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
            "categories": [],
            "type": "line",
            "style": {
                "colors": ["#1abb9b","#3497da","#9a59b5","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"],
                "barWidth": 0.8,
                "strokeWidth": 3,
                "dotSize": 4,
                "grid": true,
                "tooltipColor": "#181818",
                "tooltipBackgroundColor": "#ffffff",
                "tooltipOpacity": "0.8",
                "tooltipLineColor": "#000000",
                "tooltipFormat": (d,i) => i === 0 ? this._options.x.tickFormat(d) : `${this._options.category.parse(d[this._options.category.name])}: ${this._options.y.tickFormat(d[this._options.y.name]) || d3.format('.3s')(d[this._options.y.name])}`
            },
            "legend": {
                "show": true,
                "x": 15, 
                "y": this._margin.top,
                "interstice": 25, // distance between dots
                "backgroundColor": "#ffffff",
                "opacity": "0.9"
            },
            "download": {
                "filename": `data_${this.id}_${Date.now()}.csv`
            },
            "sparkline": {
                "range": null, // either null or array [min, max]
                "textLastPoint": true,
                "strokeWidth": 1,
                "lineColor": "#000000",
                "circleColor": "#f00",
                "textColor": "#f00",
                "textFontSize": "85%",
                "textFontWeight": "600",
                "rangeFillColor": "#ccc"
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
        // Update options
        this.options = options;
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
        if (this.isSparkline) {
            this._margin = {"top": 0, "right": 0, "bottom": 0, "left": 0};
        } else {
            this._margin = {"top": top,
                            "right": typeof right == "function" ? right(this.width) : right,
                            "bottom": bottom || this._fontSize*2 + 20,
                            "left": typeof left == "function" ? left(this.width) : left};
        }
        this._innerDimensions();
    }

    // Setting inner dimension (without axes)
    _innerDimensions() {
        this.innerWidth = this.width - this._margin.left - this._margin.right;
        this.innerHeight = this.height - this._margin.top - this._margin.bottom;

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
        Grapher.updateDict(this._options, opt);
        
        // No category is specified, we derive it from y label / name
        if (! opt.category && ! this._options.category.name) {
            this._options.categories = [this._options.y.label] || [this._options.y.name];
        } else if  (! opt.categories && (this._options.categories.length == 0 || ! opt.data || ! opt.category)) { 
            // When no list of categories is user-defined, we derive it from the data
            // pas de catégories déjà défini et pas de nouvelles données
            this._options.categories = Grapher.unique(this._options.data.map(d => d[this._options.category.name]));
        }

        // if user forgot to specify scaleTime while parsing a date
        if (opt.x && ! opt.x.scale && opt.x.parse && opt.x.parse.toString().includes('d3.timeParse')) {
            this._options.x.scale = "scaleTime";
        }
        if (opt.y && ! opt.y.scale && opt.y.parse && opt.y.parse.toString().includes('d3.timeParse')) {
            this._options.y.scale = "scaleTime";
        }

        // If user don't specify a tickFormat while using d3.timeParse, use the format arg of d3.timeParse for tickFormat
        if (opt.x && ! opt.x.tickFormat && opt.x.parse && opt.x.parse.toString().includes('d3.timeParse')) {
            this._options.x.tickFormat = d3.timeFormat(Grapher.findTimeFormat(opt.x.parse.toString()));
        }
        if (opt.y && ! opt.y.tickFormat && opt.y.parse && opt.y.parse.toString().includes('d3.timeParse')) {
            this._options.y.tickFormat = d3.timeFormat(Grapher.findTimeFormat(opt.y.parse.toString()));
        }
        
        // Defines color function
        this.color = d3.scaleOrdinal()
            .domain(this._options.categories)
            .range(this._options.style.colors);

        // Finally, parse data (if required);
        if (! this.data || opt.data || (opt.x && opt.x.parse) || (opt.y && opt.y.parse) || opt.categories) {
            this._parseData();
        }
        // set margins
        this.margin = {left:(this._options.y.label ? 80 : 60), bottom: (this._options.x.label ? this._fontSize*2 + 20 : 40)};
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
    

    // Static Methods
    // =============
    /**
     * Return the timeformat in d3.timeParse function
     * @param {string} str - string containing d3.timeParse(xxx)
     * @return {string} time format argument of d3.timeParse function
     */
    static findTimeFormat(str) {
        // Find the time format argument in timeParse
        let a = str.indexOf('d3.timeParse') + 14,
            b = str.slice(a),
            c = b.indexOf(')')-1;
        return b.slice(0,c);
    }

    /**
     * Return unique values of an array (including if there are dates)
     * @param {Array} arr - array
     * @return {Array} of unique values of 'arr'
     */
    static unique(arr) {
        if (arr.every(e => e instanceof Date)) {
            let sortDate = (a,b) => a == b ? 0 : a > b ? 1 : -1;
            return [...new Set(arr.map(r => r.getTime()))].map((r)=>(new Date(r))).sort(sortDate);
        } else if (arr.every(e => typeof e == "number")){
            return Array.from(new Set(arr)).sort((a,b) => a-b);
        } else {
            return Array.from(new Set(arr)).sort();
        }
    }
    /**
     * Get optimal decimal precision for number formatting
     * @param {number} maxN - maximum number in the data
     * @returns {string} - optimal format for d3.format
     */
    static getOptimalPrecision(maxN) {
        return `.${Math.abs(Math.floor(Math.log10((maxN > 0 ? maxN : 1))))+1}%`;
    }
    static formatTick(isLogScale, isPercentage) {
        return (d => isLogScale ? (Number.isInteger(Math.log10(d)) ? d3.format('.3s')(d) : null) : d3.format(isPercentage ? Grapher.getOptimalPrecision(d) : '.3s')(d));
    }
    
    /**
     * Update a nested Object
     * @param {Object} dict - Object to update with values in newDict
     * @param {Object} newDict - Object containing key:values to update dict with 
     */
    static updateDict(dict,newDict) {
        for (const key of Object.keys(newDict)) {
            if (Object.keys(dict).indexOf(key) > -1) {
                if (newDict[key] != null && newDict[key].constructor == Object) {
                    Grapher.updateDict(dict[key], newDict[key]);
                } else {
                    dict[key] = newDict[key];
                }
            }
        }
    }
    
    // Drawing methods
    // ===============
    sparkline() {
        
        // Define X-axis
        this.x = d3.scaleLinear()
            .range([0, this.width-2])
            .domain((this._options.x.domain ? this._options.x.domain : this.extent(this._options.x.name, this._options.x.scale)));
        this.xValues = Grapher.unique(this.data.map(d => d[this._options.x.name]));
        
        // Define y-axis
        this.y = d3.scaleLinear()
            .range([this.height-4, 0])
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
            .attr('stroke-width', this._options.sparkline.strokeWidth)
            .attr('stroke', this._options.sparkline.lineColor)
            .attr('d',d3.line()
                  .curve(d3.curveBasis)
                  .x(d => this.x(d[this._options.x.name]))
                  .y(d => this.y(d[this._options.y.name])));

        // Add point and circle
        this.lastPoint = this.data.slice(-1)[0];
        this.sparkCircle = this.g.append('circle')
            .attr('class','sparkCircle')
            .attr('cx', this.x(this.lastPoint[this._options.x.name]))
            .attr('cy', this.y(this.lastPoint[this._options.y.name]))
            .attr('r', 1.5)
            .attr('fill', this._options.sparkline.circleColor)
            .attr('stroke', 'none');
        if (this._options.sparkline.textLastPoint) {
            this.sparkText = d3.select(`#${this.id}`)
                .append('span')
                .attr('class','sparkText')
                .text(this._options.y.tickFormat(this.lastPoint[this._options.y.name]))
                .attr('style', `font-size:${this._options.sparkline.textFontSize}; font-weight:${this._options.sparkline.textFontWeight}; color: ${this._options.sparkline.textColor}; margin-bottom:${this.height/2} vertical-align:middle; display:inline-block;`);
        }
        if (this._options.y.label) {
            this.sparkText = d3.select(`#${this.id}`)
                .append('span')
                .attr('class','sparkText')
                .text(this._options.y.label)
                .attr('style', `font-size:${this._options.sparkline.textFontSize}; font-weight:${this._options.sparkline.textFontWeight}; margin-bottom:${this.height/2} vertical-align:middle; display:inline-block; padding-left: 0.4rem;`);
        }        
    }

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
        if (this._options.type == "sparkline") {
            this.sparkline();
            this.addTooltip();
        } else {
            this.addX();
            if (this._options.type == "bar") {
                this.addX2();
            }
            if (this._options.x.label) {
                this.addXLabel();
            }
            this.addY();
            if (this._options.y.label) {
                this.addYLabel();
            }

            if (this._options.grid.y.lines.length > 0) {
                this.addYGridLines();
            }
            if (this._options.grid.x.lines.length > 0) {
                this.addXGridLines();
            }
            
            // Add content      
            this._draw();

            
            // Add tooltip & legend
            this.addTooltip();
            if (this._options.legend.show) {
                this.addLegend();
            }
            
        }
    }
    /** 
     * Download the data associated with the Grapher element
     *
     */
    downloadData() {
        let domEl = document.createElement('a');
        domEl.id = "download";
        domEl.download = this._options.download.filename;
        domEl.href = URL.createObjectURL(new Blob([Grapher.to_csv(this.data)]));
        domEl.click();
    };
    /** 
     * Transform a JSON object into a csv
     * @param {Array<Object>} j - Array of objects, each object should has the same number of keys (and each key is going to be a column). 
     *   Each element of the array is going to be a line.
     * @param {Boolean} [header=true] - If true, first line of the csv fine will be a header composed of the first object keys
     * @returns {String} - return a csv file as a string
     */
    static to_csv(j,header=true) {
        let csv = '';
        if (j.length > 0) {
            let keys = Object.keys(j[0]);
            if (header) {
                csv += keys.join(',') + "\n";
            }
            csv += j.map(function(d) {
                let a = [];
                for (const k of keys) {
                    a.push('"' + d[k] + '"');
                }
                return a.join(',');
            }).join('\n');
        }
        return csv.toString();
    }

    // Graph internal methods
    // =======================
    addX() {
        // (i) Find the width
        this.xValues = Grapher.unique(this.data.map(d => d[this._options.x.name]));
        this.xNbValues = this.xValues.length;
        this.xWidth = this.innerWidth / this.xNbValues;
        this.xRange = this._options.type == "bar" ? [this.xWidth/2, this.innerWidth - this.xWidth/2] : [0, this.innerWidth];
        this.xNbTicks = d3.min([parseInt((this.width - 100) / 100), this.xNbValues]);
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
            this.addXGrid();
        }
    }
    addXLabel() {
        this.g.append("text")
            .attr("class","xLabel axisLabel")
            .attr("transform", `translate(${this.innerWidth/2},${this.height-this._margin.bottom/2})`)
            .style("text-anchor","middle")
            .text(this._options.x.label);
    };

    addX2() {
        // Second X-axis in case of bars
        this.x2 = d3.scaleBand()
            .domain(this._options.categories)
            .rangeRound([-this.xWidth/2*this._options.style.barWidth, this.xWidth/2*this._options.style.barWidth]);
    }

    addY() {
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
            this.addYGrid();
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
    addYGrid() {
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
    addXGrid() {
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
    addYGridLines() {
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
                    .text(line.label);
            }
        }
    }
    addXGridLines() {
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
                    .text(line.label);
            }
        }
    }
    addYLabel() {
        // Add Title for X axis
        this.g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this._margin.left)
            .attr("x",0 - (this.innerHeight / 2))
            .attr("dy", "1em")
            .attr("class","yLabel axisLabel")
            .style("text-anchor", "middle")
            .text(this._options.y.label);   
    }
    _draw() {
        this.g.selectAll('path.lines').remove();
        this.g.selectAll(`rect.bar`).remove();
        this.g.selectAll(`circle.dots`).remove();
        for (const category of this._options.categories) {
            if (['line','dotted-line'].indexOf(this._options.type) > -1) {
                this.g.append('path')
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
                this.g.selectAll(`rect.bar.${category.replace(/ /g,'_')}`)
                    .data(this.data.filter(d => d[this._options.category.name] === category))
                    .join('rect')
                    .attr('class', `bar ${category.replace(/ /g,'_')}`)
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
                  .style("fill", d => this.isSparkline ? this._options.sparkline["circle-color"] : this.color(d[this._options.category.name]))
                  .attr("r", this.isSparkline ? 2 : 5)
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
        let text;
        if (! this.isSparkline) {
            text = g.selectAll("text")
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
        } else {
            text = g.selectAll("text")
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

        }

        const {xx, yy, width: w, height: h} = text.node().getBBox();

        // Make sure the tooltip is always in the graph area (and visible)
        let text_x = w + mouseX + 10 > this.innerWidth ? mouseX - w - 10 : mouseX + 10,
            text_y = h + mouseY - 20 > this.innerHeight ? mouseY - h : mouseY;
        text.attr("transform", `translate(${text_x},${text_y})`);

        path.attr("x", text_x-5)
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

        // console.log(mouseXValue_, mouseIndex, a, b);
        let mouseXValue = mouseXValue_ - a > b - mouseXValue_ ? b : a,
            mouseYValues = this.data.filter(d => d[this._options.x.name].toString() == mouseXValue.toString())
            .sort((a,b) => b[this._options.y.name] - a[this._options.y.name]);
        return [mouseXValue].concat(mouseYValues);
    }

    addTooltip() {
        this.g.selectAll("g.tooltip_container").remove();
        this.tooltip = this.g.append("g").attr("class","tooltip_container");
        let that = this;
        this.g.on("touchmove mousemove", function() {
            let mouse_x = d3.mouse(this)[0],
                mouse_y = d3.mouse(this)[1];
            if (mouse_x > 0) {
                let mouseData = that._getMouseData(mouse_x);
                that._buildTooltip(that.tooltip, mouseData, that.x(mouseData[0]), mouse_y + 30);
            }
        });
        this.g.on("touchend mouseleave", () => {this.tooltip.call(this._buildTooltip, null);});
    }

    addLegend() {
        this.g.selectAll('.legend').remove();
        this.legend = this.g.append('g').attr('class','legend');
        this.legendBackground = this.legend.selectAll('rect')
            .data([null])
            .join("rect")
            .attr("class", "rect_legend")
            .attr("style",`fill:${this._options.legend.backgroundColor}; fill-opacity: ${this._options.legend.opacity};`);
        
        this.legendDots = this.legend.selectAll(".dots-legend")
            .data(this._options.categories);
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
            .data(this._options.categories);
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
            .attr('width', (w > 0 ? w + 20 : d3.max(this._options.categories.map(d => d.length))*10 + 10)) // if graph is not displayed the width and height will be zero (*)
            .attr('height',(h > 0 ?  h + 10 : this._options.categories.length * this._options.legend.interstice + 10));
        // (*) we try to estimate the width and height based on max
        //     nb of characthers of the legend text and nb of keys
        
    }
}
