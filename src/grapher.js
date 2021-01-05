/* 
 * Grapher - Tiny wrapper around D3.js for line and bar charts
 * @copyright Louis de Charsonville 2021
 */

import { Sparkline } from "./sparkline.js";
import { Chart } from "./chart.js";
import { Donut } from "./donut.js";
import { Gauge } from "./gauge.js";

class Grapher {
    constructor(id, type = "line", ...configuration) {
        switch (type.toLowerCase()){
        case "sparkline":
        case "sparklines":
            return new Sparkline(id, type, ...configuration);
            break;
        case "line":
        case "bar":
        case "barline":
            return new Chart(id, type, ...configuration);
            break;
        case "donut":
            return new Donut(id, type, ...configuration);
            break;
        case "gauge":
            return new Gauge(id, type, ...configuration);
        default:
            console.log(`Error: type ${type} is unknown.`);
            return null;
        }
    }
}

export { Grapher }
