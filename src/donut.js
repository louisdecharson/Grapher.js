import { GrapherBase } from "./base.js";
import { updateDict, barycenterColor, getBackgroundColor, unique, getDimensionText } from "./utils.js";
import { colorPalette } from "./defaults.js";

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

export { Donut }; 
