(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.g = {}));
}(this, (function (exports) { 'use strict';

    var version = "1.0.0";

    /**
     * Return the timeformat in d3.timeParse function
     * @param {string} str - string containing d3.timeParse(xxx)
     * @return {string} time format argument of d3.timeParse function
     */
    function findTimeFormat(str) {
        // Find the time format argument in timeParse
        let a = str.indexOf('d3.timeParse') + 14,
            b = str.slice(a),
            c = b.indexOf(')')-1;
        return b.slice(0,c);
    }

    /**
     * Return unique values of an array (including if there are dates)
     * @param {Array} arr - array
     * @param {boolean} sorting - whether to sort the array
     * @param {function} [_sort=undefined] - sorting function
     * @return {Array} of unique values of 'arr'
     * 
     * @example
     * let uniqueArray = unique([1, 1, 2, 3 ])
     * uniqueArray 
     * > [1, 2, 3]
     * 
     */
    function unique(array, sorting=true, _sort=undefined) {
        let uniqueArray = array;
        if (array.every(e => e instanceof Date)) {
            let sortDate = (a,b) => a == b ? 0 : a > b ? 1 : -1;
            _sort = _sort || sortDate;
            uniqueArray = [...new Set(array.map(r => r.getTime()))].map((r)=>(new Date(r)));
        } else if (array.every(e => typeof e == "number")){
            _sort = _sort || ((a, b) => a - b);
            uniqueArray = Array.from(new Set(array));
        } else {
            uniqueArray = Array.from(new Set(array));
        }
        if (sorting) {
            return uniqueArray.sort(_sort);
        }
        return uniqueArray;
    }

    /**
     * Get optimal decimal precision for number formatting
     * @param {number} maxN - maximum number in the data
     * @returns {string} - optimal format for d3.format
     */
    function getOptimalPrecision(maxN) {
        return `.${Math.abs(Math.floor(Math.log10((maxN > 0 ? maxN : 1))))+1}%`;
    }

    function formatTick(isLogScale, isPercentage) {
        return (d => isLogScale ? (Number.isInteger(Math.log10(d)) ? d3.format('.3s')(d) : null) : d3.format(isPercentage ? getOptimalPrecision(d) : '.3s')(d));
    }

    /**
     * Update a nested dictionary (stored as an Object)
     * @param {Object} dict - Object to update with values in newDict
     * @param {Object} newDict - Object containing key:values to update dict with 
     */
    function updateDict(dict, newDict) {
        for (const key of Object.keys(newDict)) {
            if (Object.keys(dict).indexOf(key) > -1) {
                if (newDict[key] != null && newDict[key].constructor == Object) {
                    updateDict(dict[key], newDict[key]);
                } else {
                    dict[key] = newDict[key];
                }
            } else {
                dict[key] = newDict[key];
            }
        }
    }

    /**
     * Retrieve the width and height of some text based on its font
     * @param {string} text - text to be measured
     * @param {string} fontSize - fontSize of the text
     * @returns {Object} - Object with width and height of the text as if it was on the DOM
     */
    function getDimensionText(text, fontSize) {
        let element = document.createElement('div');
        element.style.cssText = `position:absolute;visibility:hidden;width:auto;height:auto;white-space:nowrap;font-size:${fontSize}`;
        element.setAttribute('id','element_compute_dim');
        document.body.appendChild(element);
        element = document.getElementById('element_compute_dim');
        element.innerHTML = text;
        let width = element.clientWidth,
            height = element.clientHeight;
        element.remove();
        return {width: width, height: height};
        
    }

    /** 
     * Transform a JSON object into a csv
     * @param {Array<Object>} j - Array of objects, each object should has the same number of keys (and each key is going to be a column). 
     *   Each element of the array is going to be a line.
     * @param {Boolean} [header=true] - If true, first line of the csv fine will be a header composed of the first object keys
     * @returns {String} - return a csv file as a string
     */
    function to_csv(j, header=true) {
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

    /**
     * Split a string in substrings of length of approx. n characters
     * and splitting on space only. The function will split the string in substring of minimum length 'n'
     * on spaces inside the string.
     * @param {string} s string to be split
     * @param {number} n length of bits to split string 's'
     * @param {string} [sep="|"] separator to be used to for splitting the string. The character should not be inside the string.
     * @returns {Array} array of substrings
     */
    function splitString(s, n, sep="|") {
        return s.split('').reduce(
            (text, letter, index) => {
                return ((text.split(sep).slice(-1)[0].length > n && letter === " ") ? text.concat(sep) : text.concat(letter)); 
            },
            ''
        ).split(sep);
    }

    /**
     * Transform a 'wide' array of Dict to 'long' array, pivoting on some
     * 'pivot' columns (keys). The long format is a {id, key, value},
     * where id is one or multiple 'pivot' columns, 'key' are the non pivot columns
     * of the original array and the value are the value of the corresponding keys.
     * A category value can also be passed as a new 'column'. 
     * The long format becomes {id, key, value, category}.
     * A mapping function can also be passed to be applied to each long element 
     * (for instance to parse a date)
     * @param {Array} wideData data to pivot
     * @param {Array} pivotColumns list of keys on which to pivot from wide to long
     * @param {string} [keyName="field_id"] name of the key for variable name in the long format. 
     * @param {string} [valueName="field_value"] name of the key for value in the long format
     * @param {?string} [category="undefined"] optional category key to be added in the long data 
     * @param {function(Dict)} mapLongElement optional function to be applied on each long element
     * @example
     * wideArray = [{'date':'2020-07-19','temperature':32,'pressure':1016},
     *              {'date':'2020-07-20','temperature':25,'pressure':1020}];
     * longArray = wideToLong(wideArray, ['date']);
     * longArray = [{'date':'2020-07-19', 'field_id':'temperature','field_value':32},
     *              {'date':'2020-07-19', 'field_id':'pressure','field_value':1016},
     *              {'date':'2020-07-20', 'field_id':'temperature','field_value':25},
     *              {'date':'2020-07-20', 'field_id':'pressure','field_value':1020}]
     */
    function wideToLong(wideData,
                      pivotColumns,
                      keyName='field_id',
                      valueName='field_value',
                      category=undefined,
                      mapLongElement=undefined
                     ) {
        let longData = [],
            columns = Object.keys(wideData[0]),
            wideColumns = columns.filter( x => !pivotColumns.includes(x));
        for (const element of wideData) {
            for (const col of wideColumns) {
                let longElement = {};
                longElement[keyName] = col;
                longElement[valueName] = element[col];
                for (const col of pivotColumns) {
                    longElement[col] = element[col];
                }
                if (category != undefined) {
                    longElement['category'] = category;
                }
                if (mapLongElement != undefined) {
                    longElement = mapLongElement(longElement);
                }
                longData.push(longElement);
            }
        }
        return longData;
    }

    /**
     * Transform a 'long' array of Dict to 'wide' array, pivoting on some
     * 'index' columns (keys).
     * @param {Array} longData data to pivot
     * @param {Array} index column(s) to pivot on
     * @param {string} [keyName="field_id"] name of the key for variable name in the long format. 
     * @param {string} [valueName="field_value"] name of the key for value in the long format
     * @param {function(Dict)} mapLongElement optional function to be applied on each long element
     * @example
     * longArray = [{'date':'2020-07-19', 'field_id':'temperature','field_value':32},
     *              {'date':'2020-07-19', 'field_id':'pressure','field_value':1016},
     *              {'date':'2020-07-20', 'field_id':'temperature','field_value':25},
     *              {'date':'2020-07-20', 'field_id':'pressure','field_value':1020}] 
     * longToWide(longArray, 'date', 'field_id', 'field_value');
     * wideArray = [{'date':'2020-07-19','temperature':32,'pressure':1016},
     *              {'date':'2020-07-20','temperature':25,'pressure':1020}];
     */
    function longToWide(longData, index, column='field_id', value='field_value') {
        let wideData = {} ;
        let indexCols = Array.isArray(index) ? index : [index];
        for (const el of longData) {
            let keys = [];
            for (const i of indexCols) {
                keys.push(el[i]);
            }
            if (! wideData.hasOwnProperty(keys)) {
                wideData[keys] = {};
                for (const i of indexCols) {
                    wideData[keys][i] = el[i];
                }
            }
            wideData[keys][el[column]] = el[value];
        }
        return Object.values(wideData);
    }

    /**
     * Compute the barycenter between two colors. 
     * Returned color will be startColor * weight + endColor * (1 - weight)
     * @param {string} startColor - starting color in rgb / hsl format
     * @param {string} endColor - ending color in rgb / hsl format
     * @param {number} weight - weight of the first color
     * @returns {string} - the barycenter color
     */
    function barycenterColor(startColor, endColor, weight) {
        let repr = startColor.match(/(rgb|rgba|hsl)/)[0];
        let parseColor = (d) => (d.replace(/( |rgb|rgba|hsl|\(|\))/g,"")
                                 .split(",")
                                 .map(d => parseInt(d)));
        startColor = parseColor(startColor);
        endColor = parseColor(endColor);
        let returnColor = startColor.map(
            (d, i) => weight * d + (1 - weight) * (endColor[i] || 0)
        );
        return `${repr}(${returnColor})`;
    }
    /**
     * Return the background color of an element, if transparent returns the
     * background color of the parent element. If no parent, then the defaultColor
     * is returned.
     * @param {string} el - DOM element to retrieve bacground color from
     * @param {string} defaultColor - color to be returned if no background color is found.
    */
    function getBackgroundColor(el, defaultColor = "rgb(255, 255, 255)") {
        let elBgColor = window.getComputedStyle(el).backgroundColor;
        while (elBgColor === "rgba(0, 0, 0, 0)" || elBgColor === "transparent") {
            el = el.parentElement;
            if (el == null) {
                return defaultColor;
            } else {
                elBgColor = window.getComputedStyle(el).backgroundColor;
            }
        }
        return elBgColor;
    }

    /**
    * Base class for Grapher linking the chart to the DOM element
    * and creating the svg
    * @class GrapherBase
    * @param {string} id - id of the DOM element
    * @param {string} type - Chart type 
    * @param {number} [width=null] - width of the DOM element (if not already setup in HTML or CSS)
    * @param {number} [height=null] - height of the DOM element (if not already setup in HTML or CSS)
    */
    class GrapherBase {
        constructor(id, type, width = null, height = null) {
            this.id = id;
            this.type = type;
            this.el = document.getElementById(this.id);

            // Setting width and height
            this.width =  width || this.el.offsetWidth;
            this.height = height || this.el.offsetHeight;
            
            // Find font size of the element
            this._fontSize = parseFloat(window.getComputedStyle(this.el).fontSize);

            // Add a container for the graph
            this.container = d3.select(`#${this.id}`)
                .append('span')
                .attr('class','grapherContainer')
                .attr("width", this.width)
                .attr("height", this.height);

            this.svgWidth = this.width;
            this.svgHeight = this.height;
            
            // Add svg
            this.svg = this.container
                .append("svg")
                .attr("id", this.id + '_svg')
                .attr('class',`grapher ${type}`)
                .attr("width", this.svgWidth)
                .attr("height", this.svgHeight);

            // Define style & color from current element:
            this._style = {
                "color": window.getComputedStyle(this.el).color,
                "backgroundColor": getBackgroundColor(this.el),
                "fontSize": parseFloat(window.getComputedStyle(this.el).fontSize),
            };
            
            // Create margins
            this._margin = {};
            this.margin = {};

        }
        /**
         * Wipe the graph elements created by draw without removing the core elements
         * so that the graph can be drawn again with .draw()
         */
        wipe() {
            // Remove everything except the overlay
            this.g.selectAll(':not(.overlay)').remove();
            this.container.selectAll('.sparkText').remove();
        }
        
        /** 
         * Download the data associated with the Grapher element
         */
        downloadData() {
            let domEl = document.createElement('a');
            domEl.id = "download";
            domEl.download = this._options.download.filename || "grapher_data.csv";
            domEl.href = URL.createObjectURL(new Blob([Grapher.to_csv(this.data)]));
            domEl.click();
        };
    }

    const colorPalette = ["#1abb9b","#3497da","#9a59b5","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"];

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
            this._options = this._defaultOptions(type);
            
            // Update options
            this.options = options;

            // Check if type is sparkline
            this.isSparkline = this.type.includes("sparkline");
            this.isBar = this.type.includes("bar");
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

            // Copy some sparkline config to style
            if (this.isSparkline) {
                this._options.style.strokeWidth = this._options.sparkline.strokeWidth;
            }
            // Check if type is bar
            this.isBar = this._options.type.includes("bar");

            // If stacked-bar
            if (this._options.type.includes("stacked") && (! this.stackedData || opt.data )) {
                this.wideData = longToWide(this.data,
                                           this._options.x.name,
                                           this._options.category.name,
                                           this._options.y.name);
                this.stackedData = (d3.stack()
                                    .keys(this._options.categories || unique(this.data.map(d => d[this._options.category.name])))
                                    .value((d, key) => d[key] || 0)
                                    .offset(d3.stackOffsetDiverging)
                                    (this.wideData));
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
            if (this.isBar) {
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
        _defaultOptions(type) {
            return {
                "data": [],
                "x": {
                    "name": "x",
                    "scale": "scaleLinear",
                    "tickFormat": d3.format('.3s'),
                    "parse": null,
                    "label": null,
                    "domain": null,
                    "nice": false,
                    "padding": null,
                    "values": null
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
                "type": type,
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
        _getXDomain() {
            if (this._options.x.domain) {
                return this._options.x.domain;
            } else {
                if (['scaleBand','scaleOrdinal'].indexOf(this._options.x.scale) > -1) {
                    return this.xValues;
                } else {
                    return this.extent(this._options.x.name, this._options.x.scale);
                }
            }
        }
        _scaleBandInvert(_) {
            let domainIndex,
                n = this.domain().length,
                reverse = this.range()[1] < this.range()[0],
                start = this.range()[reverse - 0],
                stop = this.range()[1 - reverse];

            if (_ < start + this.paddingOuter() * this.step()) domainIndex = 0;
            else if (_ > stop - this.paddingOuter() * this.step()) domainIndex = n - 1;
            else domainIndex = Math.floor((_ - start - this.paddingOuter() * this.step()) / this.step());
            return this.domain()[domainIndex];
        };
        _addX() {
            // (i) Find the width
            this.xValues = this._options.x.values || unique(this.data.map(d => d[this._options.x.name]));
            this.xNbValues = this.xValues.length;
            this.xWidth = this.innerWidth / this.xNbValues;
            this.xRange = this.isBar ? [this.xWidth/2, this.innerWidth - this.xWidth/2] : [0, this.innerWidth];
            this.xNbTicks = d3.min([parseInt((this.svgWidth - 100) / 100), this.xNbValues]);
            this.x = d3[this._options.x.scale]()
                .domain(this._getXDomain())
                .range(this.xRange);
            if (this._options.x.padding && this._options.x.scale == "scaleBand") {
                this.x = this.x.padding(this._options.x.padding);
            }
            if (this._options.x.nice) {
                this.x = this.x.nice();
            }
            // Add offset to allow tooltip vertical line to cut bars in the middle
            this._xLineOffset = this._options.type.includes('stacked') ? this.x.bandwidth() / 2 : 0;
            
            // Add invert if needed
            if ( !this.x.invert) {
                this.x.invert = this._scaleBandInvert;
            }  

            // add X axis to svg
            this.g.append("g")
                .attr("class","x axis")
                .attr("transform",`translate(0, ${this.innerHeight})`)
                .call(d3.axisBottom(this.x)
                      .ticks(this.xNbTicks)
                      .tickFormat(this._options.x.tickFormat)
                      .tickSizeOuter(0)
                     );
            // in case of bars, x-axis doesn't fill the width
            if (this.isBar) {
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
            if (this._options.type == "bar") {
                this.x2 = d3.scaleBand()
                    .domain(this._options._categories)
                    .rangeRound([-this.xWidth/2*this._options.style.barWidth, this.xWidth/2*this._options.style.barWidth]);
            }
        }
        _getYDomain() {
            if (this._options.y.domain) {
                return this._options.y.domain;
            } else {
                if (this._options.type.includes('stacked')) {
                    return [d3.min(this.stackedData, d => d3.min(d, e => e[0])),
                            d3.max(this.stackedData, d => d3.max(d, e => e[0]))];
                } else {
                    return this.extent(this._options.y.name, this._options.y.scale, this._options.type == "bar");
                }
            }
        }
        _addY() {
            this.yVar = this._options.y.name;
            
            // Define Y Axis
            this.y = d3[this._options.y.scale]()
                .domain(this._getYDomain())
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
            if (this.y.domain()[0] < 0 && this.isBar) {
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
                              .defined(d => d[this._options.y.name] !== null)
                              .x(d => this.x(d[this._options.x.name])));
                }            if (this._options.type == "bar") {
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
                }        }        if (['dotted-line','dot'].indexOf(this._options.type) > -1) {
                this.g.selectAll("circle")
                    .data(this.data)
                    .join("circle")
                    .style("fill", d => this.color(d[this._options.category.name]))
                    .attr("class","dots")
                    .attr("r", this._options.style.dotSize)
                    .attr("cx", (d, i) => this.x(d[this._options.x.name]))
                    .attr("cy", (d, i) => this.y(d[this._options.y.name]));
            }        if (this._options.type == "stacked-bar") {
                this.g.append("g")
                    .attr("class","stackedBar")
                    .selectAll("g.stackedBar")
                    .data(this.stackedData)
                    .join("g")
                    .attr("fill", d => this.color(d.key))
                    .selectAll('rect')
                    .data(d => d)
                    .join("rect")
                    .attr('class','bar')
                    .attr("x", d => this.x(d.data[this._options.x.name]))
                    .attr('width', this.x.bandwidth())
                    .attr('y', d => this.y(d[1]))
                    .attr('height', d => Math.abs(this.y(d[0]) - this.y(d[1])))
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
            if (this._options.type == "stacked-area") {
                this.area = d3.area()
                    .x((d) => this.x(d.data[this._options.x.name]))
                    .y0((d) => this.y(d[0] <= d[1] ? d[0] : 0))
                    .y1((d) => this.y(d[0] <= d[1] ? d[1] : d[1]-d[0]));
                
                this.g.append("g")
                    .attr("class","stackedArea")
                    .selectAll("g.stackedArea")
                    .data(this.stackedData)
                    .join("path")
                    .attr("fill", d => this.color(d.key))
                    .attr("d", d => this.area(d));
            }

            
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
                  .attr("x1", mouseX + this._xLineOffset)
                  .attr("x2", mouseX + this._xLineOffset)
                  .attr("y1", 0)
                  .attr("y2", this.innerHeight);
            
            if (! this.isBar && ! this._options.type.includes("stacked")) {
                const dots = g.selectAll("circle")
                      .data(data.slice(1))
                      .join("circle")
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
                      .text((d,i) => this._options.style.tooltipFormat(d, i)));

            const {xx, yy, width: w, height: h} = text.node().getBBox();

            // Make sure the tooltip is always in the graph area (and visible)
            let text_x = w + mouseX + this._xLineOffset + 10 > this.innerWidth ? mouseX + this._xLineOffset - w - 10 : mouseX + this._xLineOffset + 10,
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
            let mouseXValue = typeof(mouseXValue_) === "string" ? mouseXValue_ : mouseXValue_ - a > b - mouseXValue_ ? b : a,
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

    /**
    * The Donut class is a children class of the Grapher class. This is still a work in progress. Currently the Donut is mainly a Gauge.
    *
    * @class Donut 
    *
    * @param {string} id - id of the DOM element
    * @param {Object} options - Set options for the Gauge
    * @param {number} [options.value=50] - Value to display
    * @param {function} options.foregroundColor - Function to plot a foreground color (function of the value). Default is d => #1abb9b. It's a function rather than a string so that it allows you to change the color depending on the value.
    * @param {string} options.backgroundColor - Background color of the donut. Default is the "weighted average" between the background color and foreground color with a 60% weight on the background color.
    * @param {number} [options.innerRadius=0.4*size] - inner radius of the donut. Default is 40% of the size.
    * @param {number} [options.outerRadius=0.5*size] - outer radius of the donut. Default is 50% of the size.
    * @param {number} [options.startAngle=-180] - starting angle. Default is -180 (other values allows you to plot less than a "circle").
    * @param {number} [options.endAngle=180] - ending angle. Default is 180
    * @param {number} [options.minValue=0] - mininum value when the angle is -180, default is 0.
    * @param {number} [options.maxValue=100] - maximum value when the angle is 180, default is 100.
    * @param {boolean} [options.displayValue] - display value inside the donut.
    * @param {string} options.fontSize - fontSize of the displayed value inside the donut. Default is the font size of the DOM element.
    * @param {function} displayText - text to be displayed inside the donut. It's a function of the value. Default d => d (e.g. dispkay the value).
    * @param {number} [options.cornerRadius=0] - corner radius of the arc (see cornerRadius of d3.arc for more details)
    * @param {number} [options.maxHeight=size] - maximum height of the DOM element. Default is DOM element size.
    * @param {number} [options.padAngle=0.03] - pad angle of the arc (see padAngle of d3.arc for more details)
    * @param {number|null} size - size of the gauge (for a gauge, width and height are the same).
    * @param {string} [type="donut"] - type of the graph.
    * 
    * @example
    * let myArc = new g.Donut("myArc",
    *                         {"value": 30},
    *                         size=100);
    * myArc.draw();
    */


    class Donut extends GrapherBase {
        constructor(id,  options = {}, width = null, height = null, type = "donut") {
            super(id, type, width, height);
            // Define size and radius
            this.size = this._size();
            this.radius = this._radius();

            // Create a <g> subelement inside svg.
            this._create_g();
            
            // Pass default options
            this._options = this._defaultOptions(); 
            this.options = options;
        }
        _size() {
            return Math.min(this.width, this.height);
        }
        _radius() {
            return this.size * 0.48 ;
        }
        _create_g() {
            this.g = this.svg
                .append("g")
                .attr("transform", `translate(${this.size/2},${this.size/2})`);
        }
        _defaultOptions() {
            return {
                "data": [],
                "value": {
                    "name": "value",
                    "format": d => d[this._options.value.name],
                    "displayPercentage": false
                },
                "label": {
                    "name": "name",
                    "format": d => d[this._options.label.name],
                },
                "style": {
                    "colors": colorPalette,
                    "innerRadius": 0.8 * this.radius,
                    "outerRadius": 0.4 * this.radius,
                    "outerArcRadius": 0.9 * this.radius,
                    "padAngle": 0.03,
                    "centerText": {
                        "display": true,
                        "format": d => this._options.data
                            .map(d => d[this._options.value.name])
                            .reduce((a, b) => a + b, 0),
                        "fontSize": this._style.fontSize,
                    },
                    "labels": {
                        "display": true,
                        "fontSize": this._style.fontSize * 0.8
                    },
                    "labelLines": {
                        "display": true,
                        "color": this._style.color
                    },
                    "cornerRadius": 0,
                    "startAngle": -180,
                    "endAngle": 180,
                    "minValue": 0,
                    "maxValue": 100,
                    "maxHeight": this.size,
                }
            };
        }
        /**
         * Return a d3 scale for colors
         */    
        _draw() {
            
            this.g.attr("transform", `translate(${this.size}, ${this.size/2})`);

            this.pieData = d3.pie()
                .value(d => d[this._options.value.name])(this._options.data);

            this._color = d3.scaleOrdinal(this._options.style.colors);
            
            this.outerArc = d3.arc()
                .innerRadius(this._options.style.outerArcRadius)
                .outerRadius(this._options.style.outerArcRadius);

            this.arc = d3.arc()
                .innerRadius(this._options.style.innerRadius)
                .outerRadius(this._options.style.outerRadius)
                .padAngle(this._options.style.padAngle)
                .cornerRadius(this._options.style.cornerRadius);
            
            // Add arcs
            this.arcs = this.g.selectAll('.arc')
                .data(this.pieData)
                .enter()
                .append('g')
                .attr('class','arc')
                .append('path')
                .attr('d', this.arc)
                .attr('fill', (d, i) => this._color(i));
            this.arcs.exit().remove();

            // Add labels
            if (this._options.style.labels.display) {
                this._labels();
            }

            // Add labels lines
            if (this._options.style.labelLines.display) {
                this._labelLines();
            }

            // Add center text lines
            if (this._options.style.centerText.display) {
                this._addCenterValue();
            }
        }
        _posText(pieData, isValue=false) {
            let pos = this.outerArc.centroid(pieData);
            let sign = this._midAngle(pieData) < Math.PI ? 1 : -1;
            let sizeLabel = getDimensionText(this._options.label.format(pieData.data),
                                             this._options.fontSizeLabels);
            let sizeValue = getDimensionText(this._options.value.format(pieData.data),
                                             this._options.fontSizeLabels);
            let paddingHorizontal;
            if (isValue) {
                paddingHorizontal = sizeValue.width > sizeLabel.width ? 0 : sizeLabel.width - sizeValue.width;
            } else {
                paddingHorizontal = sizeLabel.width > sizeValue.width ? 0 : sizeValue.width - sizeLabel.width;
            }
            // Update position
            pos[0] = (this.radius + paddingHorizontal) * sign;
            pos[1] = isValue ? pos[1] + sizeValue.height : pos[1] - 0.4 * sizeLabel.height;
            return pos;
        }
        _posEndLabelLines(pieData) {
            let pos = this.outerArc.centroid(pieData);
            let sign = this._midAngle(pieData) < Math.PI ? 1 : -1;
            let lengthText = getDimensionText(this._options.label.format(pieData.data),
                                              this._options.fontSizeLabels);
            pos[0] = (this.radius + lengthText.width) * sign;
            return pos;
        }
        _midAngle(pieData) {
            return (pieData.startAngle + (pieData.endAngle + pieData.startAngle) / 2);
        }
        _labels() {
            // Add label name
            this.labelsName =  this.g.selectAll("text.labelName")
                .data(this.pieData);
            this.labelsName.enter()
                .append("text")
                .attr("class", "labelName")
                .attr("dy", this._options.fontSizeLabels)
                .text(d => `${this._options.label.format(d.data)}`)
                .attr("transform", d => `translate(${this._posText(d)})`)
                .attr("text-anchor", d => this._midAngle(d) < Math.PI ? "start" : "end");
            this.labelsName.exit().remove();

            // Add label value
            this.labelsValue =  this.g.selectAll("text.labelValue")
                .data(this.pieData);
            this.labelsValue.enter()
                .append("text")
                .attr("dy", this._options.fontSizeLabels)
                .attr("class", "labelValue")
                .text(d => `${this._options.value.format(d.data)}`)
                .attr("transform", d => `translate(${this._posText(d, true)})`)
                .attr("text-anchor", d => this._midAngle(d) < Math.PI ? "start" : "end");
            this.labelsValue.exit().remove();

        }
        _labelLines() {
            // Add labelsline
            this.labelLines = this.g.selectAll("polyline.labelLines")
                .data(this.pieData);
            this.labelLines.enter()
                .append("polyline")
                .attr('class', 'labelLines')
                .attr("points", d => [this.arc.centroid(d),
                                      this.outerArc.centroid(d),
                                      this._posEndLabelLines(d)])
                .attr("fill", "none")
                .attr("stroke", this._options.style.labelLines.color);
            this.labelLines.exit().remove();
        }
        _addCenterValue() {
            // Add current value
            this.g.append("text")
                .attr("transform", `translate(0,0)`)
                .attr("text-anchor", "middle")
                .style("font-size", this._options.style.centerText.fontSize)
                .style("fill", this._style.color)
                .text(this._options.style.centerText.format);
        }
        get options () {
            return this._options;
        }
        set options(opt) {
            updateDict(this._options, opt);
            this.degree = d3.scaleLinear()
                .range([this._options.startAngle, this._options.endAngle])
                .domain([this._options.minValue, this._options.maxValue]);
            this.el.style.maxHeight = this._options.style.maxHeight;
        }

        _deg2rad(angle) {return angle * Math.PI / 180;}
        
        setArcInBound(angle) {
            if (angle >= this._options.startAngle && angle <= this._options.endAngle) {
                return angle;
            } else if (angle <= this._options.startAngle) {
                return this._options.startAngle;
            } else {
                return this._options.endAngle;
            }
        }
        draw(options) {
            if (options) {
                this.options = options;
            }
            this._draw();
        }
    }

    /**
    * The Gauge is a child of Donut class with convenient defaults for plotting a gauge.
    *
    * @class Gauge
    *
    * @param {string} id - id of the DOM element
    * @param {Object} options - Set options for the Gauge
    * @param {number|null} size - size of the gauge (for a gauge, width and height are the same).
    * 
    * @example
    * let myGauge = new g.Donut("myGauge",
    *                          {"value": 20},
    *                          size=100);
    * myGauge.draw();
    * 
    */
    class Gauge extends GrapherBase {
        constructor(id,
                    options={},
                    size = null) {
            let el = document.getElementById(id);
            size =  size || Math.min(el.offsetWidth, el.offsetHeight);

            super(id, options, size, size, "gauge");
                    updateDict(this._style,
                       {"foregroundColor": "#1abb9b",
                        "backgroundColor": barycenterColor(
                            window.getComputedStyle(this.el).color,
                               getBackgroundColor(this.el),
                            0.6)});

            this.size = size;
            
            this.g = this.svg
                .append("g")
                .attr("transform", `translate(${this.size/2},${this.size/2})`);
            this._options = {
                "value": 50,
                "foregroundColor": d => this._style.foregroundColor,
                "backgroundColor": this._style.backgroundColor,
                "innerRadius": 0.4*this.size,
                "outerRadius": this.size/2,
                "startAngle": -90,
                "endAngle": 90,
                "minValue": 0,
                "maxValue": 100,
                "displayValue": true,
                "fontSize": this._style.fontSize,
                "displayText": d => d,
                "cornerRadius": this.size / 10,
                "maxHeight": this.size / 2 + "px",
                "padAngle": 0.0
            };
            this.options = options;
        }
        _arc() {
            return d3.arc()
                .innerRadius(this._options.innerRadius)
                .outerRadius(this._options.outerRadius)
                .padAngle(this._options.padAngle)
                .startAngle(this._deg2rad(this._options.startAngle))
                .cornerRadius(this._options.cornerRadius);
        }
        get options () {
            return this._options;
        }
        set options(opt) {
            updateDict(this._options, opt);
            this.degree = d3.scaleLinear()
                .range([this._options.startAngle, this._options.endAngle])
                .domain([this._options.minValue, this._options.maxValue]);
            this.el.style.maxHeight = this._options.maxHeight;
        }

        _deg2rad(angle) {return angle * Math.PI / 180;}
        
        setArcInBound(angle) {
            if (angle >= this._options.startAngle && angle <= this._options.endAngle) {
                return angle;
            } else if (angle <= this._options.startAngle) {
                return this._options.startAngle;
            } else {
                return this._options.endAngle;
            }
        }
        draw(options) {
            if (options) {
                this.options = options;
            }
            // Draw background
            this.g.append("path")
                .datum({endAngle: this._deg2rad(this._options.endAngle)})
                .attr("class","gauge background")
                .attr("fill", this._options.backgroundColor)
                .attr("d", this._arc());
            
            // Draw foreground
            this.g.append("path")
                .datum({endAngle: this._deg2rad(
                    this.setArcInBound(this.degree(this._options.value))
                )})
                .attr("class","gauge foreground")
                .attr("fill", this._options.foregroundColor(this._options.value))
                .attr("d", this._arc());
            
            // Add current value
            this.g.append("text")
                .attr("transform", `translate(0,0)`)
                .attr("text-anchor", "middle")
                .style("font-size", this._options.fontSize)
                .style("fill", this._style.color)
                .text(this._options.displayText(this._options.value));
        }
    }

    /* 
     * Grapher - Tiny wrapper around D3.js for line and bar charts
     * @copyright Louis de Charsonville 2021
     */

    class Grapher$1 {
        constructor(id, type = "line", ...configuration) {
            switch (type.toLowerCase()){
            case "sparkline":
            case "sparklines":
                return new Sparkline(id, type, ...configuration);
            case "line":
            case "bar":
            case "barline":
            case "stacked-bar":
            case "stacked-area":
                return new Chart(id, type, ...configuration);
            case "donut":
                return new Donut(id, type, ...configuration);
            case "gauge":
                return new Gauge(id, type, ...configuration);
            default:
                console.log(`Error: type ${type} is unknown.`);
                return null;
            }
        }
    }

    exports.Chart = Chart;
    exports.Donut = Donut;
    exports.Gauge = Gauge;
    exports.Grapher = Grapher$1;
    exports.GrapherBase = GrapherBase;
    exports.Sparkline = Sparkline;
    exports.barycenterColor = barycenterColor;
    exports.findTimeFormat = findTimeFormat;
    exports.formatTick = formatTick;
    exports.getBackgroundColor = getBackgroundColor;
    exports.getDimensionText = getDimensionText;
    exports.getOptimalPrecision = getOptimalPrecision;
    exports.longToWide = longToWide;
    exports.splitString = splitString;
    exports.to_csv = to_csv;
    exports.unique = unique;
    exports.updateDict = updateDict;
    exports.version = version;
    exports.wideToLong = wideToLong;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
