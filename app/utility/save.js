const fs = require('fs');
const { fork } = require('child_process');
const createFork = require('./createSendRDBFork')

function saveToRDB(dir,p,filePath,connection,dict,TTL) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const rdbWriter = fork('./utility/writeRDB.js');
    rdbWriter.send({ dict, TTL, fileName: filePath });
    rdbWriter.on('message', (msg) => {
        if (msg === 'done') {
            console.log("fork completed")
            connection.write('+OK\r\n');
            createFork()
            isDataDirty = false
            rdbWriter.kill();
        }
    });

    rdbWriter.on('error', (err) => {
        console.error('Error in RDB writer:', err);
        connection.write('-ERR\r\n');
    });
}

module.exports = saveToRDB;