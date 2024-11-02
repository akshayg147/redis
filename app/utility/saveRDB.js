const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { redis_main_const, OPCODES, TYPES } = require("./consts");
const logger = require("../logger.js")("persistance");

function writeRDBFile(dict, filename) {
    const file = fs.openSync(filename, 'w');

    const header = Buffer.alloc(9);
    header.write(redis_main_const[REDIS_MAGIC_STRING]);
    header.write(redis_main_const[REDIS_VERSION]);
    fs.writeSync(file, header);

    for (const key in dict) {
        const valueObj = dict[key];
        const value = valueObj.value;

        
        const type = (Buffer.byteLength(value) > 32) ? TYPES.COMPRESSED_STRING : TYPES.STRING;

        
        fs.writeSync(file, Buffer.from([type]));

        
        const keyBuffer = Buffer.from(key, 'utf-8');
        fs.writeSync(file, Buffer.from([keyBuffer.length]));
        fs.writeSync(file, keyBuffer);

        
        let valueBuffer;
        if (type === TYPES.COMPRESSED_STRING) {
            valueBuffer = lzf.compress(Buffer.from(value, 'utf-8'));
        } else {
            valueBuffer = Buffer.from(value, 'utf-8');
        }
        fs.writeSync(file, Buffer.from([valueBuffer.length]));
        fs.writeSync(file, valueBuffer);
    }

    fs.writeSync(file, Buffer.from([OPCODES.EOF]));
    fs.closeSync(file);
}


