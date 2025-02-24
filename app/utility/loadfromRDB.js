const fs = require('fs');
const { redis_main_const, OPCODES, TYPES } = require('./consts');
// const lzf = require('lzf'); // Assuming lzf is being used for compression/decompression

function readRDBFile(filename) {
    const file = fs.openSync(filename, 'r');
    const buffer = fs.readFileSync(file);
    let offset = 0;

    // Verify the header
    const magicString = buffer.subarray(offset, 5).toString('utf-8');
    offset += 5;
    const version = buffer.readUInt8(offset);
    offset += 1;

    if (magicString !== redis_main_const.REDIS_MAGIC_STRING || version !== redis_main_const.REDIS_VERSION) {
        throw new Error('Invalid RDB file header');
    }

    const dict = {};
    const TTL = {};
    let lastKey; // Save the last processed key for TTL association

    while (offset < buffer.length) {
        const typeCode = buffer.readUInt8(offset);
        offset += 1;

        if (typeCode === OPCODES.EOF) {
            break;
        } 
        
        else if (typeCode === OPCODES.EXPIRETIME) {
            const keyBuffer = buffer.subarray(offset, offset + 8);
            const expirationTime = Number(keyBuffer.readBigInt64BE());
            TTL[lastKey] = expirationTime;
            offset += 8;
            continue;
        }

        const keyLength = buffer.readUInt8(offset);
        offset += 1;

        const key = buffer.subarray(offset, offset + keyLength).toString('utf-8');
        offset += keyLength;

        const valueLength = buffer.readUInt8(offset);
        offset += 1;

        const valueBuffer = buffer.subarray(offset, offset + valueLength);
        offset += valueLength;

        let value;

        switch (typeCode) {
            case TYPES.STRING:
                value = valueBuffer.toString('utf-8');
                break;
            case TYPES.COMPRESSED_STRING:
                value = lzf.decompress(valueBuffer).toString('utf-8');
                break;
            case TYPES.LIST:
                value = deserializeList(valueBuffer);
                break;
            case TYPES.SET:
                value = deserializeSet(valueBuffer);
                break;
            case TYPES.HASH:
                value = deserializeHash(valueBuffer);
                break;
            default:
                throw new Error(`Unknown type code: ${typeCode}`);
        }

        dict[key] = value;
        lastKey = key; // Save the last processed key for TTL association
    }

    fs.closeSync(file);
    console.log("------------------------");
    console.log(dict);
    console.log("-------------------------");
    console.log(TTL);
    console.log("--------------------")
    return { "dict_load":dict, "ttl":TTL };
}

// Helper functions to deserialize specific data types
function deserializeList(buffer) {
    const items = [];
    let offset = 0;
    while (offset < buffer.length) {
        const itemLength = buffer.readUInt8(offset);
        offset += 1;
        const item = buffer.slice(offset, offset + itemLength).toString('utf-8');
        offset += itemLength;
        items.push(item);
    }
    return items;
}

function deserializeSet(buffer) {
    return new Set(deserializeList(buffer));
}

function deserializeHash(buffer) {
    const map = new Map();
    let offset = 0;
    while (offset < buffer.length) {
        const fieldLength = buffer.readUInt8(offset);
        offset += 1;
        const field = buffer.slice(offset, offset + fieldLength).toString('utf-8');
        offset += fieldLength;

        const valueLength = buffer.readUInt8(offset);
        offset += 1;
        const value = buffer.slice(offset, offset + valueLength).toString('utf-8');
        offset += valueLength;

        map.set(field, value);
    }
    return map;
}

module.exports = { readRDBFile };
