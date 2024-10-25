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
            var value = {"value":null,"ttl":-1};
            var connectionFlag = 1
            var isValidOption = 0
            const key = listStr[4]
            if(listStr[5] && listStr[6]){
            value["value"] = listStr[5]+ '\r\n' + listStr[6] + '\r\n'}
            var returnStr = '+OK\r\n';
            for (let i=8 ; i < listStr.length-1; i+=2){
                if (validSetOptions.has(listStr[i])){
                    if (listStr[i].toUpperCase() === "EX") {

                        if(listStr[i+2] && Number.isInteger(Number(listStr[i+2]))){
                        value["ttl"] = ['s',Number(listStr[i+2]),Date.now()]
                        i += 3
                        }
                        else{
                            console.log("EX error")
                            connectionFlag = 0
                            connection.write("-ERR Please specify the time! \r\n"); 
                        }
                    }

                    else if (listStr[i].toUpperCase() === "PX") {

                        if(listStr[i+2] && Number.isInteger(Number(listStr[i+2]))){
                        value["ttl"] = ['ms',Number(listStr[i+2]),Date.now()]
                        i += 3
                        }
                        else{
                            connectionFlag = 0
                            connection.write("-ERR Please specify the time! \r\n"); 
                        }
                    }

                    else if (listStr[i].toUpperCase() === "NX"){

                        if (key in dict){
                            connection.write("-ERR Key already exists!\r\n");
                            connectionFlag = 0
                        }
                    }

                    else if (listStr[i].toUpperCase() === "XX"){

                        if (!(key in dict)){
                            connection.write("-ERR Key does not exists!\r\n");
                            connectionFlag = 0
                        }
                    }

                    else if (listStr[i].toUpperCase() === "KEEPTTL"){

                        if (key in dict){
                            value["ttl"] = dict[key]["ttl"]
                        }
                        else {
                            connection.write("-ERR Key does not exists!\r\n");
                            connectionFlag = 0
                        }
                    }

                    else if (listStr[i].toUpperCase() === "GET"){

                        if (key in dict){
                            value["ttl"] = dict[key]["ttl"]
                            if (dict[key]["ttl"] != -1){
                                unit = dict[key]["ttl"][0]
                                if (unit == "s"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = (Date.now() - insertTime)/1000;
                                    console.log(timeDiffMillisec)
                                    if (timeDiffMillisec > time){
                                        delete dict[key];
                                        connection.write("-ERR Key does not exists!\r\n");
                                        connectionFlag = 0
                                    }
                                }
                                else if (unit == "ms"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = Date.now() - insertTime;
                                    if (timeDiffMillisec > time){
                                        delete dict[key]
                                        connection.write("-ERR Key does not exists!\r\n");
                                        connectionFlag = 0
                                    }
                                }
                            }
                            returnStr = "$" + dict[key]["value"].length + "\r\n"+ dict[key]["value"] + "\r\n"
                            console.log(returnStr);
                        }
                        else{
                            connectionFlag = 0
                            connection.write("-ERR Key does not exists!\r\n"); 
                        }
                    }
                }
                else {
                    connection.write("-ERR Options doesnt exists!\r\n");
                    connectionFlag = 0
                }
            }

            if (connectionFlag && value["value"]){
            dict[key] = value
            console.log(dict)
            connection.write(returnStr);
            }

            else{
                console.log("here")
                if (connectionFlag){
                    connection.write("-ERR Unable to insert!\r\n"); 
                }


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

server.on('exit', () => {
    console.log("Server closed gracefully.");
    server.close();
  })

server.listen(6379, "127.0.0.1");

server.on("error", (err) => {
    console.log("Server error:", err);
});