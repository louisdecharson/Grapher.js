# Grapher

Grapher is a wrapper around [D3.js](https://d3js.org).

## Installation

```{html}
<script src="./d3.js"></script>
<script src="./grapher.js"></script>
```

## Example 

```{html}
<body>

        <h2>My Graph</h2>
        <button onclick="switchBarLine()">Switch bar / lines</button>
        <div id="myPlot"></div>
        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js" integrity="sha256-m0QmIsBXcOMiETRmpT3qg2IQ/i0qazJA2miCHzOmS1Y=" crossorigin="anonymous"></script>
        <script src="./grapher.js"></script>
        <script>
         data = [{"value":3,"Country/Region":"France","date":"2020-01-21T23:00:00.000Z"},
                 {"value":1,"Country/Region":"France","date":"2020-01-22T23:00:00.000Z"},
                 {"value":4,"Country/Region":"France","date":"2020-01-23T23:00:00.000Z"},
                 {"value":7,"Country/Region":"France","date":"2020-01-24T23:00:00.000Z"},
                 {"value":-3,"Country/Region":"Italy","date":"2020-01-21T23:00:00.000Z"},
                 {"value":3,"Country/Region":"Italy","date":"2020-01-22T23:00:00.000Z"},
                 {"value":4,"Country/Region":"Italy","date":"2020-01-23T23:00:00.000Z"},
                 {"value":10,"Country/Region":"Italy","date":"2020-01-24T23:00:00.000Z"}]

         let options = {
             "data": data,
             "x": {
                 "name":"date",
                 "scale": "scaleTime",
                 "tickFormat": d3.timeFormat("%d/%m/%y"),
                 "parse": (d) => new Date(d)
             },
             "y": {
                 "name": "value",
                 "scale": "scaleLinear",
                 "tickFormat": d3.format('.3s')
             },
             "category": "Country/Region",
             "type": "lines",
             "style": {
                 "grid": false
             }
         }
         let myGraph = new Grapher("myPlot", options);
         myGraph.draw();

         function switchBarLine() {
             if (myGraph.options.type == "bar") {
                 myGraph.draw({"type":"lines"});
             } else {
                 myGraph.draw({"type":"bar"})
             }
         }
        </script>
    </body>
```


## Credits

Copyright: Louis de Charsonville, louisdecharson@posteo.net
