const net = require("net");



const server = net.createServer((connection) => {
    connection.on("data", (data) => {
    const dataStr = data.toString()
    if (dataStr.toLowerCase() === '*1\r\n$4\r\nping\r\n') {
    connection.write('\+PONG\r\n');}

    else if (dataStr.split('\r\n')[2].toLowerCase() === "echo") {
        var echoStr = dataStr.split('\r\n')[3] + "\r\n" + dataStr.split('\r\n')[4] + "\r\n"
        connection.write(echoStr);  
    }
    })
    connection.on("close", () => {
        console.log("Connection closed");
        connection.end();
      })
});

process.on('exit', () => {
    console.log("Server closed gracefully.");
    server.close();
  })

server.listen(6379, "127.0.0.1");

server.on("error", (err) => {
    console.log("Server error:", err);
});