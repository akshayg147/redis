const fs = require('fs');
const net = require('net');

function sendRDBToSlave(rdbFilePath, slavePort) {
    const client = new net.Socket();
    let isConnected = false;
    
    const cleanup = () => {
        if (isConnected) {
            client.end();
        }
        // Only send message if process is still connected
        if (process.connected) {
            process.send('done');
        }
    };

    client.connect(slavePort, '127.0.0.1', () => {
        isConnected = true;
        console.log('Connected to slave');
        client.write("+START_RDB_TRANSFER\r\n");
        
        setTimeout(() => {
            const fileStream = fs.createReadStream(rdbFilePath);
            
            fileStream.on('error', (err) => {
                console.error('Error reading file:', err);
                if (process.connected) {
                    process.send('error');
                }
                cleanup();
            });

            fileStream.pipe(client);
            
            fileStream.on('end', () => {
                console.log('File transfer complete');
                cleanup();
            });
        }, 100);
    });
    
    client.on('error', (err) => {
        console.error('Connection error:', err);
        if (process.connected) {
            process.send('error');
        }
        cleanup();
    });
}

process.on('message', ({ rdbFilePath, slavePort }) => {
    if (!rdbFilePath || !slavePort) {
        console.error('Missing required parameters');
        process.exit(1);
    }
    
    console.log("Starting RDB transfer to slave...");
    sendRDBToSlave(rdbFilePath, slavePort);
});

// Handle process disconnection
process.on('disconnect', () => {
    process.exit(0);
});
