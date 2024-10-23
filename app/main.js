const net = require("net");

const dict = {};
const validSetOptions = new Set(["EX","PX","NX","XX","KEEPTTL","GET"]);

const server = net.createServer((connection) => {
    connection.on("data", (data) => {
    const listStr = data.toString().split('\r\n');
    const cmd = listStr[2].toLowerCase()
    console.log(listStr.length)
    console.log(listStr)
    if (cmd === 'ping') {
    connection.write('\+PONG\r\n');
    }

    else if (cmd === "echo") {
        var echoStr = listStr[3] + "\r\n" + listStr[4] + "\r\n"
        connection.write(echoStr);  
    }

    else if (cmd === "set") {
            var value = {"value":NaN,"ttl":-1};
            var connectionFlag = 1
            const key = listStr[4]
            value["value"] = listStr[5]+ '\r\n' + listStr[6] + '\r\n'
            var returnStr = '+OK\r\n';
            for (let i = 9; i <= listStr.length; i+=2){
                console.log("in here")
                if (validSetOptions.has(listStr[i])){
                    if (listStr[i].toUpperCase() === "EX") {
                        finalValue["ttl"] = ['s',Number(listStr[i+2]),Date.now()]
                    }

                    else if (listStr[i].toUpperCase === "PX") {
                        finalValue["ttl"] = ['ms',Number(listStr[i+2]),Date.now()]
                    }

                    else if (listStr[i].toUpperCase === "NX"){
                        if (key in dict){
                            connection.write("Key already exists");
                            connectionFlag = 0
                            connection.end()
                        }
                    }

                    else if (listStr[i].toUpperCase === "XX"){
                        if (!(key in dict)){
                            connection.write("Key does not exists!");
                            connectionFlag = 0
                            connection.end()
                        }
                    }

                    else if (listStr[i].toUpperCase === "KEEPTTL"){
                        if (key in dict){
                            finalValue["ttl"] = dict[key]["ttl"]
                        }
                        else {
                            connection.write("Key does not exists!");
                            connectionFlag = 0
                            connection.end()
                        }
                    }

                    else if (listStr[i].toUpperCase === "GET"){
                        if (key in dict){
                            if (dict[key]["ttl"] != -1){
                                unit = dict[key]["ttl"][0]
                                if (unit === "s"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = (Date.now() - insertTime)/1000;
                                    if (timeDiffMillisec >= time){
                                        connection.write("Key has expired!");
                                        connectionFlag = 0
                                        connection.end()
                                    }
                                }
                                else if (unit === "ms"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = Date.now() - insertTime;
                                    if (timeDiffMillisec >= time){
                                        connection.write("Key has expired!");
                                        connectionFlag = 0
                                        connection.end()
                                    }
                                }
                            }
                            returnStr = "$" + dict[key]["value"].length + "\r\n"+ dict[key]["values"] + "\r\n"
                        }
                    }

                }
            }
            if (connectionFlag) {
            dict[key] = value
            connection.write(returnStr);  
            }
    }

    else if (cmd === "get") {
        const key = listStr[4]
        if (dict[key] && listStr.length == 6){
            connection.write(dict[key]["value"]); 
        }
        else {
            connection.write('$-1\r\n'); 
        }
    }
})


    connection.on("end", () => {
        console.log("Client disconnected");
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