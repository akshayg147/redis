const net = require("net");



const server = net.createServer((connection) => {
    connection.on("data", (data) => {
    const dataStr = data.toString().toLowerCase()
    if (dataStr === '*1\r\n$4\r\nping\r\n') {
    connection.write('\+PONG\r\n');}
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