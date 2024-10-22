const net = require("net");



const server = net.createServer((connection) => {
    connection.on("data", (data) => {
    console.log(data)
    connection.write('\+PONG\r\n');
    })
});

server.listen(6379, "127.0.0.1");

server.on("error", (err) => {
    console.error("Server error:", err);
});