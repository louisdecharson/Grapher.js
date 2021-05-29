import { getBackgroundColor } from "./utils.js";

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

export { GrapherBase }
