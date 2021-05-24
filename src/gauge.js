import { GrapherBase } from "./base.js";
import { updateDict, barycenterColor, getBackgroundColor, unique } from "./utils.js";

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

export { Gauge };
