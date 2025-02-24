const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const saveToRDB = require('./sendRDBfile');

function createFork(rdbFilePath, slavePort){
    // const rdbFilePath = './tmp/redis-files/dump.rdb';
    // connectionFD = slaveConnection._handle.fd
    const sendFile = fork('./utility/sendRDBfile.js');
    sendFile.send({ rdbFilePath }, slavePort);
    sendFile.on('message', (msg) => {
        if (msg === 'done') {
            console.log("sent the RDB file!")
            slaveConnection.write('+OK\r\n');
            isDataDirty = false
            sendFile.kill();
        }
    });
    sendFile.on('error', (err) => {
        console.error('Error in RDB send:', err);
        slaveConnection.write('-ERR\r\n');
    });

    sendFile.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Child process exited with code ${code}`);
            slaveConnection.write('-ERR\r\n');
        }
    });
}

module.exports = createFork;