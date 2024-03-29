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
 * @param {Array} array - array
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
};

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
};
/**
 * This function mimics Python pandas function group by.
 * @param {Array} array - the array to group by
 * @param {string} key - key to group by with
 * @param {Array} [colSum=[]] - array of columns to agg by sum
 * @param {Array} [colCount=[]] - array of columns to agg by count
 * @param {Array} [colFirst=[]] - array of columns to keep first
 */
function groupBy(array, key, colSum = [], colCount = [], colFirst = []) {
    return d3.nest()
        .key(d => d[key])
        .rollup(d => {
            let out = {};
            colSum.forEach(k => out[k] = d3.sum(d, v => v[k]));
            colCount.forEach(k =>out[k] = d.filter(v => v[k] != null).length);
            colSum.forEach(k => out[k] = d[0][k]);
            return out;
        })
        .entries(array)
        .map(g => {
            let out = {};
            out[key] = g.key;
            [...colSum,...colCount,...colFirst].forEach(k => {
                out[k] = g.value[k];
            });
            return out;
        });    
}

export { findTimeFormat, unique, getOptimalPrecision, formatTick, updateDict,
         getDimensionText, to_csv, splitString, wideToLong, longToWide, barycenterColor,
         getBackgroundColor, groupBy }
