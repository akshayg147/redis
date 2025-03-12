const net = require('net');
const { readRDBFile } = require('./loadfromRDB');
const fs = require('fs');
const { loadRDBFile } = require('./loadfromRDB');
function sendCommand(command, client) {
    return new Promise((resolve, reject) => {
        client.write(command);

        client.on("data", (data) => {
            resolve(data.toString());
        });

        client.on("error", (err) => {
            console.log("ERR sending command",err)
            reject("failed");
        });
    });
}

async function handleHandShake(masterHost, masterPort, slavePort, client) {
    try {
        // 1. Send PING to master
        console.log("Sending PING to master...");
        let response = await sendCommand("*1\r\n$4\r\nPING\r\n", client);
        console.log('Received from master:', response);
        if (response === "failed" || response === "+PONG") {
            return 0;
        }
        
        // 2. Send REPLCONF to master (first REPLCONF)
        console.log("Sending REPLCONF to master...");
        response = await sendCommand(`*3\r\n$8\r\nREPLCONF\r\n$14\r\nlistening-port\r\n$4\r\n${slavePort}\r\n`, client);
        console.log('Received from master:', response);
        if (response != "+OK\r\n"){
            return 0;
        }
        
        // 3. Send REPLCONF to master (second REPLCONF)
        console.log("Sending REPLCONF to master...");
        response = await sendCommand("*3\r\n$8\r\nREPLCONF\r\n$4\r\ncapa\r\n$6\r\npsync2\r\n", client);
        console.log('Received from master:', response);
        if (response != "+OK\r\n"){
            return 0;
        }
        
        // 4. Send PSYNC to master
        console.log("Sending PSYNC to master...");
        response = await sendCommand("*3\r\n$5\r\nPSYNC\r\n$1\r\n?\r\n$2\r\n-1\r\n", client);
        console.log('Received from master:', response);

        console.log("Starting RDB transfer...");
        response = await sendCommand("*2\r\n$17\r\nSTART_RDB_TRANSFER\r\n$1\r\n1\r\n", client);
        
        const rdbDir = `./tmp/redis-files/test/${slavePort}`;
        if (!fs.existsSync(rdbDir)) {
            fs.mkdirSync(rdbDir, { recursive: true });
        }
        
        const writeStream = fs.createWriteStream(`${rdbDir}/RDB.rdb`);
        
        client.pipe(writeStream);
        
        writeStream.on('finish', () => {
            console.log('RDB file received and saved successfully');
            try {
                const { dict, TTL } = readRDBFile(`${rdbDir}/RDB.rdb`);
                // You might want to do something with dict and TTL here
                console.log('RDB file loaded successfully');
            } catch (err) {
                console.error('Error loading RDB file:', err);
            }
        });

        writeStream.on('error', (err) => {
            console.error('Error writing RDB file:', err);
        });

    } catch (err) {
        console.error('Error in handshake:', err);
        return 0;
    }
}

function initatHandshake(masterHost,masterPort,slavePort) {
    const client = net.Socket();
    console.log("intiating handshake...")
    console.log(masterHost,masterPort)
    client.connect(masterPort,masterHost, () => {
        handleHandShake(masterHost,masterPort,slavePort,client)
    })

    client.on("error", (err) => {
        console.error(`Error`,err);
      });

     //*********** Need to handle the case when slave shuts down then the port should be removed from master **********/
      client.on("close", () => {
        console.log(`Slave disconnected.`);
      });
    
}

module.exports = initatHandshake;