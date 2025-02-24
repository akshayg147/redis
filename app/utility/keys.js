const minimatch = require('minimatch');

function convertListToRESPArray(list) {
    if (!Array.isArray(list)) {
        throw new Error("Input must be an array of strings.");
    }

    let resp = `*${list.length}\r\n`;

    for (const element of list) {
        if (typeof element !== "string") {
            throw new Error("All elements of the list must be strings.");
        }
        const length = element.length;
        resp += `$${length}\r\n${element}\r\n`;
    }

    return resp;
}


function match_keys(dict,pattern) {
    const keys = Object.keys(dict);
    const matchedKeys = keys.filter(key => minimatch(key, pattern));
    const RESPresponse = convertListToRESPArray(matchedKeys)
    return RESPresponse;
}


module.exports = { match_keys };