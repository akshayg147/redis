const fs = require('fs');
const path = require('path');

function sendRDBToSlave(rdbFilePath, slaveConnection) {
    const fileStream = fs.createReadStream(rdbFilePath);
    slaveConnection.write("+START_RDB_TRANSFER\r\n")
    console.log("hey there sendinf sending")
    fileStream.on('open', () => {
        fileStream.pipe(slaveConnection);
    });
    fileStream.on('error', (err) => {
        console.error("Error reading RDB file:", err);
        process.send('error');
    });

    slaveConnection.on('error', (err) => {
        console.error("Error writing to slave socket:", err);
        process.send('error');
    });

    slaveConnection.on('close', () => {
        console.log("Slave socket closed");
    });
}

process.on('message', ({ rdbFilePath },connection) => {
    console.log("Sending RDB file to slave...");
    // const connection = new net.Socket({ fd: connectionFD });
    sendRDBToSlave(rdbFilePath,connection);
    process.send('done'); // Notify the parent process when done
});
