import { Donut } from "./donut.js";

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
class Gauge extends Donut {
    constructor(id,
                options={},
                size = null) {
        super(id, options, size, "gauge");
        this.options = {
            "maxHeight": this.size / 2 + "px",
            "cornerRadius": this.size / 10,
            "startAngle": -90,
            "endAngle": 90,
            "padAngle": 0
        };
    }
}

export { Gauge };
