function Grapher(id, options = {}, width = null, height = null) {
    // Grapher class
    // =============
    // Code: Louis de Charsonville
    
    // id : id of the graph
    this.id = id;
    this.el = document.getElementById(this.id);

    // Setting width and height
    this.width = width ? width : this.el.offsetWidth;
    this.height = height ? height : this.el.offsetHeight;

    // add container
    this.container = d3.select(`#${this.id}`)
        .append('span')
        .attr('class','grapherContainer');
    
    // Add svg
    this.svg = this.container
        .append("svg")
        .attr("id", this.id + '_svg')
        .attr("width", this.width)
        .attr("height", this.height);

    // Check if options set to sparkline
    if (options.type != undefined &&
        options.type == "sparkline") {
        this.isSparkline = true;
    } else {
        this.isSparkline = false;
    }


    // Setting margin
    this._setMargin = function({top=10,
                                right=((x) => x < 400 ? 20 : 30),
                                bottom=40,
                                left=(x) => x < 400 ? 40 : 60}={}) {
        this.margin = {};
        if (this.isSparkline) {
            this.margin = {
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0
            };
        }  else {
            this.margin.top = top;
            this.margin.right = typeof right == "function" ? right(this.width) : right;
            this.margin.bottom = parseFloat(window.getComputedStyle(document.getElementById(this.id)).fontSize)*2 + 20;
            this.margin.left = typeof left == "function" ? left(this.width) : left;
        }
        this._innerDimensions(); 
    };
    
    
    // Setting inner width and inner height (without axes)
    this._innerDimensions = function() {
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        this._createSVG();
    };
    
    // Creating the svg
    this._createSVG = function() {
        this.svg.select(`#${this.id}_g`).remove();
        this.g = this.svg.append("g")
            .attr('id', this.id + '_g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this._addOverlay();
    };
    
    // Add overlay for focus & tooltip
    this._addOverlay = function() {
        this.g.append("rect")
            .attr("class", "overlay")
            .attr("fill","none")
            .attr("style","pointer-events:all;")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight);
    };

    //
    this._setMargin();
    
    // Default-Options
    this.options = {
        "data": [],
        "x": {
            "name": "x",
            "scale": "scaleLinear",
            "tickFormat": d3.format('.3s'),
            "parse": false,
            "label": false,
            "domain": null
        },
        "y": {
            "name": "y",
            "scale": "scaleLinear",
            "tickFormat": d3.format('.3s'),
            "parse": false,
            "label": false,
            "domain": ""
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
            "stroke-width": 3,
            "dot-size": 4,
            "grid": true,
            "tooltipColor": "#181818",
            "tooltipBackgroundColor": "#ffffff",
            "tooltipOpacity": "0.8",
            "tooltipLineColor": "#000000"
        },
        "legend": {
            "hide": false,
            "x": 15, 
            "y": this.margin.top,
            "distance": 25, // distance between dots
            "backgroundColor": "#ffffff",
            "opacity": "0.9"
        },
        "download": {
            "filename": `data_${this.id}_${Date.now()}.csv`
        },
        "sparkline": {
            "range": null, // either null or array [min, max]
            "textLastPoint": true,
            "stroke-width": 1,
            "line-color": "#000000",
            "circle-color": "#f00",
            "text-color": "#f00",
            "text-font-size": "85%",
            "text-font-weight": "600",
            "range-fill-color": "#ccc"
        }
    };
    this.getCategoriesList = function(data=this.options.data,category=this.options.category.name) {
        if (! this.options.category.name) {
            this.options.categories = this.options.y.label ? [this.options.y.label] : [this.options.y.name];
        } else {
            this.options.categories = d3.set(data.map(d => d[category])).values();
        }
    };
    this.parseData = function() {
        if (this.options.x.parse || this.options.y.parse) {
            let data = [];
            for (const d of this.options.data) {
                let _ = {};
                _[this.options.x.name] = this.options.x.parse ? this.options.x.parse(d[this.options.x.name]) : d[this.options.x.name];
                _[this.options.y.name] = this.options.y.parse ? this.options.y.parse(d[this.options.y.name]) : d[this.options.y.name];
                if (this.options.category.name) {
                    _[this.options.category.name] =  d[this.options.category.name];
                } else {
                    _['category'] = this.options.y.label ? this.options.y.label : this.options.y.name;
                }
                data.push(_);
            }
            this.options.data = data;
            // update category name in case
            this.options.category.name = this.options.category.name || 'category';
        }
    };
    this.updateOptions = function (options) {
        for (const key of Object.keys(options)) {
            if (Object.keys(this.options).indexOf(key) > -1) {
                if (this.options[key].constructor == Object) { // true if
                    for (const subkey of Object.keys(options[key])) {
                        if (Object.keys(this.options[key]).indexOf(subkey) > -1) {
                            this.options[key][subkey] = options[key][subkey];
                        }
                    }
                } else {
                    this.options[key] = options[key];
                }
            }
        }
        // If no category is passed, use 'category', see also parseData
        if (! options.category && ! this.options.category.name) {
            options.categories = ['category'];
        }
        if (! options.categories || this.options.categories.length == 0) {
            this.getCategoriesList();
        }
        // if user forgot to specify scaleTime while parsing a date
        if (! options.x.scale && options.x.parse && options.x.parse.toString().includes('d3.timeParse')) {
            this.options.x.scale = "scaleTime";
        }
        if (! options.y.scale && options.y.parse && options.y.parse.toString().includes('d3.timeParse')) {
            this.options.y.scale = "scaleTime";
        }
        
        // If user don't specify a tickFormat while using d3.timeParse, use the format arg of d3.timeParse for tickFormat
        this._findTimeFormat = function(str) {
            // Find the time format argument in timeParse
            let a = str.indexOf('d3.timeParse') + 14,
                b = str.slice(a),
                c = b.indexOf(')')-1;
            return b.slice(0,c);
        };
        if (! options.x.tickFormat && options.x.parse && options.x.parse.toString().includes('d3.timeParse')) {
            this.options.x.tickFormat = d3.timeFormat(this._findTimeFormat(options.x.parse.toString()));
        }
        if (! options.y.tickFormat && options.y.parse && options.y.parse.toString().includes('d3.timeParse')) {
            this.options.y.tickFormat = d3.timeFormat(this._findTimeFormat(options.y.parse.toString()));
        }

        
        this.color = d3.scaleOrdinal()
            .domain(this.options.categories)
            .range(this.options.style.colors);

        this.parseData();

        this._setMargin({bottom:(this.options.x.label ? 60 : 30),
                         left:(this.options.y.label ? 80 : 60)});
        
    };
    
    this.updateOptions(options);
    

    // ===
    
    this._unique = function(arr) {
        if (arr.every(e => e instanceof Date)) {
            let sortDate = (a,b) => a == b ? 0 : a > b ? 1 : -1;
            return [...new Set(arr.map(r => r.getTime()))].map((r)=>(new Date(r))).sort(sortDate);
        } else {
            return Array.from(new Set(arr)).sort();
        }
    };
    this._getOptimalPrecision = (n) => `.${Math.abs(Math.floor(Math.log10((n > 0 ? n : 1))))+1}%`;
    this._extent = function(variable, scale, enforceMinimumAt0=false, data=this.options.data) {
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
    };
    
    this.addX = function(options=null) {
        if (options) {
            this.updateOptions(options);
        }
        
        // Define X-axis
        // -------------
        // (i) Find the width
        this.xValues = this._unique(this.options.data.map(d => d[this.options.x.name]));
        this.xNbValues = this.xValues.length;
        this.xWidth = this.innerWidth / this.xNbValues;
        this.xRange = this.options.type == "bar" ? [this.xWidth/2, this.innerWidth - this.xWidth/2] : [0, this.innerWidth];
        this.xNbTicks = d3.min([parseInt((this.width - 100) / 100), this.xNbValues]);
        this.x = d3[this.options.x.scale]()
            .domain((this.options.x.domain ? this.options.x.domain : this._extent(this.options.x.name, this.options.x.scale)))
            .nice()
            .range(this.xRange);

        // add X axis to svg
        this.g.append("g")
            .attr("class","x axis")
            .attr("transform",`translate(0, ${this.innerHeight})`)
            .call(d3.axisBottom(this.x)
                  .ticks(this.xNbTicks)
                  .tickFormat(this.options.x.tickFormat)
                 );
        // add horizontal line to complete x axis when there is no grid
        if (!this.options.style.grid) {
            this.g.append("g")
                .attr("class","x axis")
                .attr("transform", `translate(0, ${this.innerHeight + 0.5})`)
                .attr("opacity","1")
                .append('line')
                .attr('stroke','currentColor')
                .attr('x2', this.innerWidth);
        }
    };

    this.addXLabel = function(options=null) {
        // Add Title for X axis
        if (options) {
            this.updateOptions(options);
        }
        this.g.append("text")
            .attr("class","xLabel axisLabel")
            .attr("transform", `translate(${this.innerWidth/2},${this.height-this.margin.bottom/2})`)
            .style("text-anchor","middle")
            .text(this.options.x.label);
    };

    this.addX2 = function(options=null) {
        // Second X-axis in case of bars
        if (options) {
            this.updateOptions(options);
        }
        this.x2 = d3.scaleBand()
            .domain(this.options.categories)
            .rangeRound([-this.xWidth/2*this.options.style.barWidth, this.xWidth/2*this.options.style.barWidth]);
    };

    this.addY = function(options=null) {
        if (options) {
            this.updateOptions(options);
        }
        this.yVar = this.options.y.name;

        // Define Y Axis
        this.y = d3[this.options.y.scale]()
            .domain(this.options.y.domain ? this.options.y.domain : this._extent(this.options.y.name, this.options.y.scale, this.options.type == "bar"))
            .nice()
            .range([this.innerHeight, 0]);

        // Add Y axis to svg
        this.g.append("g")
        .attr('class','y axis')
        .call(d3.axisLeft(this.y)
              .tickFormat(this.options.y.tickFormat));
        // Define Y grid
        if (this.options.style.grid) {
            this.addYGrid();
        }
        // Add X axis at 0
        if (this.y.domain()[0] < 0 && this.options.type == "bar") {
            this.g.append("g")
                .attr("class","x axis")
                .attr("transform", `translate(0, ${this.y(0)})`)
                .attr("opacity","1")
                .append('line')
                .attr('stroke','currentColor')
                .attr('x2', this.innerWidth);
        }

    };

    this.addYGrid = function(options=null) {
        if (options) {
            this.updateOptions(options);
        }
        // Define Y grid
        this.yGrid = svg => svg
            .call(d3.axisRight(this.y)
                  .tickSize(this.innerWidth)
                  .tickFormat(this.options.y.tickFormat))
            .call(g => g.selectAll('.domain').remove())
            .call(g => g.selectAll(".tick:not(:first-of-type) line")
                  .attr("stroke-opacity", 0.5)
                  .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
                  .remove());
        // Add Y-Grid to svg
        this.g.append("g")
            .attr('class','yGrid')
            .call(this.yGrid);
    };

    this.addYLabel = function(options=null) {
        // Add Title for X axis
        if (options) {
            this.updateOptions(options);
        }
        this.g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left)
            .attr("x",0 - (this.innerHeight / 2))
            .attr("dy", "1em")
            .attr("class","yLabel axisLabel")
            .style("text-anchor", "middle")
            .text(this.options.y.label);   
    };

    this._drawContent =  function(options=null) {
        if (options) {
            this.updateOptions(options);
        }
        this.g.selectAll('path.lines').remove();
        this.g.selectAll(`rect.bar`).remove();
        this.g.selectAll(`circle.dots`).remove();
        
        for (const category of this.options.categories) {
            if (['line','dotted-line'].indexOf(this.options.type) > -1) {
                this.g.append('path')
                    .datum(this.options.data.filter(d => d[this.options.category.name] === category))
                    .attr('class','lines')
                    .attr('fill', 'none')
                    .attr('stroke', d => this.color(category))
                    .attr('stroke-width', this.options.style["stroke-width"])
                    .attr('d', d3.line()
                          .y(d => this.y(d[this.options.y.name]))
                          .defined(d => d[this.options.y.name])
                          .x(d => this.x(d[this.options.x.name])));
            };
            if (this.options.type == "bar") {           
                this.g.selectAll(`rect.bar.${category.replace(/ /g,'_')}`)
                    .data(this.options.data.filter(d => d[this.options.category.name] === category))
                    .join('rect')
                    .attr('class', `bar ${category.replace(/ /g,'_')}`)
                    .attr('fill',  d => this.color(category))
                    .attr('x', d => this.x(d[this.options.x.name]) + this.x2(category))
                    .attr('width', this.x2.bandwidth())
                    .attr('y', d => d[this.options.y.name] > 0 ? this.y(d[this.options.y.name]) : this.y(0))
                    .attr('height', d => Math.abs(this.y(0) - this.y(d[this.options.y.name])))
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
        if (['dotted-line','dot'].indexOf(this.options.type) > -1) {
            this.g.selectAll("circle")
                .data(this.options.data)
                .join("circle")
                .style("fill", d => this.color(d[this.options.category.name]))
                .attr("class","dots")
                .attr("r", this.options.style["dot-size"])
                .attr("cx", (d, i) => this.x(d[this.options.x.name]))
                .attr("cy", (d, i) => this.y(d[this.options.y.name]));
        };
    };


    // Tooltip
    this._buildTooltip = function(g, data, mouseX, mouseY) {
        if (! data) return g.style("display","none");
        g.style("display", null);

        const xLine = g.selectAll("line")
              .data([null])
              .join("line")
              .attr("class", "tooltip_line")
              .attr('style',`stroke: ${this.options.style.tooltipLineColor};`)
              .attr("x1", mouseX)
              .attr("x2", mouseX) 
              .attr("y1", 0)
              .attr("y2", this.innerHeight);
        
        if (this.options.type != "bar") {
            const dots = g.selectAll("circle")
                  .data(data.slice(1))
                  .join("circle")
                  .style("fill", d => this.isSparkline ? this.options.sparkline["circle-color"] : this.color(d[this.options.category.name]))
                  .attr("r", this.isSparkline ? 2 : 5)
                  .attr("cx", (d, i) => this.x(d[this.options.x.name]))
                  .attr("cy", (d, i) => this.y(d[this.options.y.name]));
        }
        
        
        // background of tooltip
        const path = g.selectAll("rect")
              .data([null])
              .join("rect")
              .attr("class","rect_tooltip")
              .attr("style",`fill:${this.options.style.tooltipBackgroundColor}; fill-opacity: ${this.options.style.tooltipOpacity};`);

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
                      .style("fill",(d, i) => i === 0 ? this.options.style.tooltipColor : this.color(d[this.options.category.name]))
                      .text((d,i) => i === 0 ? this.options.x.tickFormat(d) : `${this.options.category.parse(d[this.options.category.name])}: ${this.options.y.tickFormat(d[this.options.y.name])}`));
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
                      .style("fill",(d, i) => this.options.style.tooltipColor)
                      .text((d,i) => `${this.options.y.tickFormat(d[this.options.y.name])}`)
                      .attr('style', `font-size:${this.options.sparkline['text-font-size']};`));

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
    };

    this._getMouseData = function(mouseX) {
        let mouseXValue_ = this.x.invert(mouseX), // mouse value projection on X axis
            mouseIndex = d3.bisector(d => d).left(this.xValues, mouseXValue_), // mouse index on X axis
            a = mouseIndex > 0 ? this.xValues[mouseIndex - 1] : 0,
            b = mouseIndex > this.xValues.length - 1 ? this.xValues.slice(-1)[0] : this.xValues[mouseIndex];
        // We get value before mouseIndex and at mouseIndex to find out to which value mouse is the closest;

        // console.log(mouseXValue_, mouseIndex, a, b);
        let mouseXValue = mouseXValue_ - a > b - mouseXValue_ ? b : a,
            mouseYValues = this.options.data.filter(d => d[this.options.x.name].toString() == mouseXValue.toString())
            .sort((a,b) => b[this.options.y.name] - a[this.options.y.name]);
        return [mouseXValue].concat(mouseYValues);
    };

    this.addTooltip = function (options=null) {
        if (options) {
            this.updateOptions(options);
        }
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
    };

    this.addLegend = function(options=null) {
        if (options) {
            this.updateOptions(options);
        }
        this.g.selectAll('.legend').remove();
        this.legend = this.g.append('g').attr('class','legend');
        this.legendBackground = this.legend.selectAll('rect')
            .data([null])
            .join("rect")
            .attr("class", "rect_legend")
            .attr("style",`fill:${this.options.legend.backgroundColor}; fill-opacity: ${this.options.legend.opacity};`);
        
        this.legendDots = this.legend.selectAll(".dots-legend")
            .data(this.options.categories);
        this.legendDots.exit().remove();
        this.legendDots.enter()
            .append("circle")
            .merge(this.legendDots)
            .attr("cx", this.options.legend.x + 10)
            .attr("cy", (d,i) => this.options.legend.y + i * this.options.legend.distance)
            .attr("r", 3)
            .attr('class','dots-legend')
            .style("fill",d => this.color(d));

        // Add one dot in the legend for each name.
        this.legendLabels = this.legend.selectAll(".labels-legend")
            .data(this.options.categories);
        this.legendLabels.exit().remove();
        this.legendLabels.enter()
            .append("text")
            .merge(this.legendLabels)
            .attr("x", this.options.legend.x + 30)
            .attr("y", (d,i) => this.options.legend.y + i * this.options.legend.distance)
            .style("fill", d => this.color(d))
            .text(t => this.options.category.parse(t))
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
        this.legendBackground.attr('x', this.options.legend.x-5)
            .attr('y',this.options.legend.y-10)
            .attr('width', (w > 0 ? w + 20 : d3.max(this.options.categories.map(d => d.length))*10 + 10)) // if graph is not displayed the width and height will be zero (*)
            .attr('height',(h > 0 ?  h + 10 : this.options.categories.length * this.options.legend.distance + 10));
        // (*) we try to estimate the width and height based on max
        //     nb of characthers of the legend text and nb of keys
        
    };

    this.sparkline = function() {
        
        // Define X-axis
        this.x = d3.scaleLinear()
            .range([0, this.width-2])
            .domain((this.options.x.domain ? this.options.x.domain : this._extent(this.options.x.name, this.options.x.scale)));
        this.xValues = this._unique(this.options.data.map(d => d[this.options.x.name]));
        
        // Define y-axis
        this.y = d3.scaleLinear()
            .range([height-4, 0])
            .domain(this.options.y.domain ? this.options.y.domain : this._extent(this.options.y.name, this.options.y.scale));
        
        // Remove existing
        this.svg.selectAll('g.sparkline').remove();

        // Change svg and g container
        this.container.attr('style','vertical-align:middle; display:inline-block;');
        this.g.attr('transform', 'translate(0,2)')
            .attr('class','sparkline');


        // Add range
        if (this.options.sparkline.range) {
            let dataRange = this.options.data.map(d => {d.minRange = this.options.sparkline.range[0]; d.maxRange = this.options.sparkline.range[1]; return d;});
            this.g.append('path')
                .datum(dataRange)
                .attr('fill', this.options.sparkline['range-fill-color'])
                .attr('stroke','none')
                .attr('d', d3.area()
                      .x(d => this.x(d[this.options.x.name]))
                      .y0(d => this.y(d.minRange))
                      .y1(d => this.y(d.maxRange)));
        }
        
        // Add sparkline
        this.sparkLine = this.g.append('path')
            .datum(this.options.data)
            .attr('class', 'sparkLine')
            .attr('fill', 'none')
            .attr('stroke-width', this.options.sparkline["stroke-width"])
            .attr('stroke', this.options.sparkline["line-color"])
            .attr('d',d3.line()
                  .curve(d3.curveBasis)
                  .x(d => this.x(d[this.options.x.name]))
                  .y(d => this.y(d[this.options.y.name])));

        // Add point and circle
        this.lastPoint = this.options.data.slice(-1)[0];
        this.sparkCircle = this.g.append('circle')
            .attr('class','sparkCircle')
            .attr('cx', this.x(this.lastPoint[this.options.x.name]))
            .attr('cy', this.y(this.lastPoint[this.options.y.name]))
            .attr('r', 1.5)
            .attr('fill', this.options.sparkline["circle-color"])
            .attr('stroke', 'none');
        if (this.options.sparkline.textLastPoint) {
            this.sparkText = d3.select(`#${this.id}`)
                .append('span')
                .attr('class','sparkText')
                .text(this.options.y.tickFormat(this.lastPoint[this.options.y.name]))
                .attr('style', `font-size:${this.options.sparkline['text-font-size']}; font-weight:${this.options.sparkline['text-font-weight']}; color: ${this.options.sparkline['text-color']}; margin-bottom:${this.height/2} vertical-align:middle; display:inline-block;`);
        }
        if (this.options.y.label) {
            this.sparkText = d3.select(`#${this.id}`)
                .append('span')
                .attr('class','sparkText')
                .text(this.options.y.label)
                .attr('style', `font-size:${this.options.sparkline['text-font-size']}; font-weight:${this.options.sparkline['text-font-weight']}; margin-bottom:${this.height/2} vertical-align:middle; display:inline-block; padding-left: 0.4rem;`);
        }
    };
    
    // Draw
    this.draw = function(options=null) {

        if (options) {
            this.updateOptions(options);
        }

        this._setMargin();
        
        // Clean
        this.g.selectAll('g.x.axis').remove();
        this.g.selectAll('g.y.axis').remove();
        this.g.selectAll('g.yGrid').remove();

        
        // Add axis & grid
        if (this.options.type == "sparkline") {
            this.sparkline();
            this.addTooltip();
        } else {
            this.addX();
            if (this.options.type == "bar") {
                this.addX2();
            }
            if (this.options.x.label) {
                this.addXLabel();
            }
            this.addY();
            if (this.options.y.label) {
                this.addYLabel();
            }
            
            // Add content      
            this._drawContent();

            // Add tooltip & legend
            this.addTooltip();
            this.addLegend();
        }
    };

    // Download data
    this.downloadData = function() {
        let domEl = document.createElement('a');
        domEl.id = "download";
        domEl.download = this.options.download.name;
        domEl.href = URL.createObjectURL(new Blob([to_csv(this.options.data)]));
        domEl.click();
    };
}
