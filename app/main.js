const net = require("net");



const server = net.createServer((connection) => {
    console.log("coonection etablished");
    connection.write('+PONG\r\n');
});

server.listen(6379, "127.0.0.1");

server.on("error", (err) => {
    console.error("Server error:", err);
});