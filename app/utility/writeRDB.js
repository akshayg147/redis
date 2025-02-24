const fs = require('fs');
const path = require('path');
const {redis_main_const, OPCODES, TYPES } = require('./consts')

function writeRDBFile(dict,TTL,filename) {
    const file = fs.openSync(filename, 'w');
    const header = Buffer.alloc(6);
    header.write(redis_main_const.REDIS_MAGIC_STRING, 0, 5, 'utf-8'); 
    header.writeUInt8(redis_main_const.REDIS_VERSION, 5); 
    fs.writeSync(file, header);

    for (const key in dict) {
        const valueObj = dict[key];
        const value = valueObj;
        console.log(valueObj)
        let typeCode;
        let valueBuffer;

        if(TTL[key] < Date.now()){
            console.log("Deleted")
            continue
        }
        if (Array.isArray(value)) {
            typeCode = TYPES.LIST;
            valueBuffer = serializeList(value);
        } else if (value instanceof Set) {
            typeCode = TYPES.SET;
            valueBuffer = serializeSet(value);
        } else if (value instanceof Map) {
            typeCode = TYPES.HASH;
            valueBuffer = serializeHash(value);
        } else {
            typeCode = (Buffer.byteLength(value) > 32) ? TYPES.COMPRESSED_STRING : TYPES.STRING;
            valueBuffer = typeCode === TYPES.COMPRESSED_STRING 
                ? lzf.compress(Buffer.from(value, 'utf-8')) 
                : Buffer.from(value, 'utf-8');
        }

        fs.writeSync(file, Buffer.from([typeCode]));

        const keyBuffer = Buffer.from(key, 'utf-8');
        fs.writeSync(file, Buffer.from([keyBuffer.length]));
        fs.writeSync(file, keyBuffer);

        fs.writeSync(file, Buffer.from([valueBuffer.length]));
        fs.writeSync(file, valueBuffer);
        if (TTL[key]){
            fs.writeSync(file, Buffer.from([OPCODES.EXPIRETIME]));
            const expirationBuffer = Buffer.alloc(8);
            expirationBuffer.writeBigInt64BE(BigInt(TTL[key]), 0);
            fs.writeSync(file, expirationBuffer);
        }
    }

    fs.writeSync(file, Buffer.from([OPCODES.EOF]));
    fs.closeSync(file);
}

// Helper functions to serialize specific data types
function serializeList(list) {
    return Buffer.concat(list.map(item => Buffer.from(item, 'utf-8')));
}

function serializeSet(set) {
    return Buffer.concat(Array.from(set).map(item => Buffer.from(item, 'utf-8')));
}

function serializeHash(hash) {
    const bufferArray = [];
    for (const [field, fieldValue] of hash) {
        const fieldBuffer = Buffer.from(field, 'utf-8');
        const valueBuffer = Buffer.from(fieldValue, 'utf-8');
        bufferArray.push(Buffer.from([fieldBuffer.length]), fieldBuffer, Buffer.from([valueBuffer.length]), valueBuffer);
    }
    return Buffer.concat(bufferArray);
}

// module.exports = { writeRDBFile };
process.on('message', ({ dict, TTL, fileName }) => {
    writeRDBFile(dict, TTL, fileName);
    process.send('done'); // Notify the parent process when done
});