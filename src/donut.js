import { GrapherBase } from "./base.js";
import { updateDict, barycenterColor, getBackgroundColor, unique } from "./utils.js";

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
    constructor(id,  options = {}, size = null, type = "donut") {
        let el = document.getElementById(id);
        size =  size || Math.min(el.offsetWidth, el.offsetHeight);
        super(id, type, size, size);
        this.size = size;
        updateDict(this._style,
                   {"foregroundColor": "#1abb9b",
                    "backgroundColor": barycenterColor(
                        window.getComputedStyle(this.el).color,
                           getBackgroundColor(this.el),
                        0.6)});
        
        this.g = this.svg
            .append("g")
            .attr("transform", `translate(${this.size/2},${this.size/2})`);
        
        this._options = {
            "value": 50,
            "foregroundColor": d => this._style.foregroundColor,
            "backgroundColor": this._style.backgroundColor,
            "innerRadius": 0.4*this.size,
            "outerRadius": this.size/2,
            "startAngle": -180,
            "endAngle": 180,
            "minValue": 0,
            "maxValue": 100,
            "displayValue": true,
            "fontSize": this._style.fontSize,
            "displayText": d => d,
            "cornerRadius": 0,
            "maxHeight": this.size,
            "padAngle": 0.03
        };
        this.options = options;
    }
    arc() {
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
            .attr("d", this.arc());
        
        // Draw foreground
        this.g.append("path")
            .datum({endAngle: this._deg2rad(
                this.setArcInBound(this.degree(this._options.value))
            )})
            .attr("class","gauge foreground")
            .attr("fill", this._options.foregroundColor(this._options.value))
            .attr("d", this.arc());
        
        // Add current value
        this.g.append("text")
            .attr("transform", `translate(0,0)`)
            .attr("text-anchor", "middle")
            .style("font-size", this._options.fontSize)
            .style("fill", this._style.color)
            .text(this._options.displayText(this._options.value));
    }
}

export { Donut }; 
