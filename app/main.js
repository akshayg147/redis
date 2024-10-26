const net = require("net");

const dict = {};
const validSetOptions = new Set(["EX","PX","NX","XX","KEEPTTL","GET"]);

const server = net.createServer((connection) => {
    connection.on("data", (data) => {
    const listStr = data.toString().split('\r\n');
    const cmd = listStr[2].toLowerCase()
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
            var deleteKey = 0
            var keyDNE = 0
            const key = listStr[4]
            if(listStr[5] && listStr[6]){
            value["value"] = listStr[5]+ '\r\n' + listStr[6] + '\r\n'}
            var returnStr = '+OK\r\n';
            for (let i=8 ; i < listStr.length; i+=2){
                console.log(i)
                if (validSetOptions.has(listStr[i])){
                    if (listStr[i].toUpperCase() === "EX") {

                        if(listStr[i+2] && Number.isInteger(Number(listStr[i+2]))){
                        value["ttl"] = ['s',Number(listStr[i+2]),Date.now()]
                        i += 2
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
                        i += 2
                        }
                        else{
                            connectionFlag = 0
                            connection.write("-ERR Please specify the time! \r\n"); 
                        }
                    }

                    else if (listStr[i].toUpperCase() === "NX"){
                        if (key in dict){
                            if (dict[key]["ttl"] != -1){
                                unit = dict[key]["ttl"][0]
                                if (unit == "s"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = (Date.now() - insertTime)/1000;
                                    if (timeDiffMillisec > time){
                                        delete dict[key]
                                    }
                                }
                                else if (unit == "ms"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = Date.now() - insertTime;
                                    if (timeDiffMillisec > time){
                                        delete dict[key]
                                    }
                                }
                            }
                        }
                        if (key in dict){
                            connection.write("-ERR Key already exists!\r\n");
                            connectionFlag = 0
                        }
                    }

                    else if (listStr[i].toUpperCase() === "XX"){

                        if (!(key in dict)){
                            keyDNE = 1
                            connectionFlag = 0
                        }
                        else {
                            if (dict[key]["ttl"] != -1){
                                unit = dict[key]["ttl"][0]
                                if (unit == "s"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = (Date.now() - insertTime)/1000;
                                    console.log(timeDiffMillisec)
                                    if (timeDiffMillisec > time){
                                        // delete dict[key];
                                        keyDNE = 1
                                        deleteKey = 1
                                        connectionFlag = 0
                                    }
                                }
                                else if (unit == "ms"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = Date.now() - insertTime;
                                    if (timeDiffMillisec > time){
                                        // delete dict[key];
                                        keyDNE = 1
                                        deleteKey = 1
                                        connectionFlag = 0
                                    }
                                }
                            }
                        }
                    }

                    else if (listStr[i].toUpperCase() === "KEEPTTL"){
                        console.log("KEEPTTL")
                        if (key in dict){
                            if (dict[key]["ttl"] != -1){
                                unit = dict[key]["ttl"][0]
                                if (unit == "s"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = (Date.now() - insertTime)/1000;
                                    if (timeDiffMillisec > time){
                                        // delete dict[key];
                                        keyDNE = 1
                                        deleteKey = 1
                                        connectionFlag = 0
                                    }
                                }
                                else if (unit == "ms"){
                                    console.log("1111111")
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = Date.now() - insertTime;
                                    if (timeDiffMillisec > time){
                                        console.log("222222")
                                        // delete dict[key]
                                        keyDNE = 1
                                        deleteKey = 1
                                        connectionFlag = 0
                                    }
                                }
                            }
                            if(connectionFlag){
                            value["ttl"] = dict[key]["ttl"]
                            }
                        }
                        else {
                            keyDNE = 1
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
                                        // delete dict[key];
                                        keyDNE = 1
                                        deleteKey = 1
                                        connectionFlag = 0
                                    }
                                }
                                else if (unit == "ms"){
                                    var time = dict[key]["ttl"][1]
                                    const insertTime = dict[key]["ttl"][2]
                                    let timeDiffMillisec = Date.now() - insertTime;
                                    if (timeDiffMillisec > time){
                                        keyDNE = 1
                                        deleteKey = 1
                                        connectionFlag = 0
                                    }
                                }
                            }
                            returnStr = "$" + dict[key]["value"].length + "\r\n"+ dict[key]["value"] + "\r\n"
                            console.log(returnStr);
                        }
                        else{
                            connectionFlag = 0
                            keyDNE = 1
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
                console.log("Here buddy!")
                if (deleteKey){
                    delete dict[key]
                }
                if(keyDNE){
                    connection.write("-ERR Key does not exists!\r\n");
                }
                if (connectionFlag){
                    connection.write("-ERR Unable to insert!\r\n"); 
                }
            }
    }

    else if (cmd === "get") {
        const key = listStr[4]
        if (key in dict){
            if (dict[key]["ttl"] != -1){
                unit = dict[key]["ttl"][0]
                if (unit == "s"){
                    var time = dict[key]["ttl"][1]
                    const insertTime = dict[key]["ttl"][2]
                    let timeDiffMillisec = (Date.now() - insertTime)/1000;
                    if (timeDiffMillisec > time){
                        delete dict[key];
                    }
                }
                else if (unit == "ms"){
                    var time = dict[key]["ttl"][1]
                    const insertTime = dict[key]["ttl"][2]
                    let timeDiffMillisec = Date.now() - insertTime;
                    if (timeDiffMillisec > time){
                        delete dict[key]
                    }
                }
            }
        }
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