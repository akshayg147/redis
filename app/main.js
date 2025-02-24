const net = require("net");
const { toRESPArray,configCMD } = require('./utility/formateMsg');
let dict = {};
const { redisInfo,replicaSet } = require('./config/replicas');
const { updateReplicas } = require('./utility/updateReplicas');
const { match_keys } = require("./utility/keys");
const validSetOptions = new Set(["EX","PX","NX","XX","KEEPTTL","GET"]);
const validCMDGetOptions = new Set();
const logger = require('./logger')('server')
const { writeRDBFile } = require('./utility/writeRDB.js');
const configuration = require('./config/config')
const fs = require('fs');
const path = require('path');
const { readRDBFile } = require('./utility/loadfromRDB');
const { setArguments } = require('./startup/startup')
const { NONAME } = require("dns");
const initatHandshake = require("./utility/handshake");
const { fork } = require('child_process');
const saveToRDB = require('./utility/save')
const connections_record = require('./config/connections.js')
let isDataDirty = true; //This flag indicates whether the in-memory data has been modified since the last SAVE i.e the RDB file in the store is not updated.

var isRDBTransfer = false
var inSync = {};
var isSlave = false;
//formate the msg in RESP formate
function formatMessage(text = null) {
	if (text) return `+${text}\r\n`;
	return `$-1\r\n`;
}

function formatConfigMessage(value) {
	return `$${value.length}\r\n${value}\r\n`;
}

const config = new Map();
const arguments = process.argv.slice(2);
console.log(arguments)
const serverType = arguments.indexOf("--replicaof") != -1 ? "slave" : "master";
const { fileDir, fileName,port,error } = setArguments(arguments)
const finalPort = port ? port : 6379;
let masterPort = 0
if (serverType === "slave"){
    const [masterHost, masterPort] = arguments.at(-1).split(" ");
    initatHandshake(masterHost, masterPort,finalPort)
    console.log("completed")
}
else{
    masterPort = finalPort;
}

if (fileDir && fileName) {
	config.set('dir', fileDir);
	config.set('dbfilename', fileName);
}


function load(Slave,slavefilePath){

    if ((fileDir && fileName) && fs.existsSync(fileDir+'/'+fileName) && !Slave){
    const { dict_load, ttl }= readRDBFile(fileDir+'/'+fileName)
    //console.log(dict_load)
    dict = dict_load;
    //console.log(ttl)
    TTL = ttl
    isDataDirty = false
    }
    else if (slavefilePath && Slave) {
        const { dict_load, ttl }= readRDBFile(slavefilePath)
        //console.log(dict_load)
        dict = dict_load;
        //console.log(ttl)
        TTL = ttl
    }
}

const server = net.createServer((connection) => {
    connection.on("data", (data) => {
    // console.log("cmd=>",data.toString())
    const listStr = data.toString().split('\r\n');
    const cmd = listStr[2].toLowerCase()
    if (cmd === 'ping') {
    connection.write('\+PONG\r\n');
    }

    else if (cmd === "echo") {
        var echoStr = listStr[3] + "\r\n" + listStr[4] + "\r\n"
        connection.write(echoStr);  
    }

    else if (cmd === "set") {
            var value = null
            var expiryTime = null
            var connectionFlag = 1
            var deleteKey = 0
            var keyDNE = 0
            const key = listStr[4]
            //console.log(key)
            if(listStr[5] && listStr[6]){
            // value["value"] = listStr[5]+ '\r\n' + listStr[6] + '\r\n'
            var value = listStr[6]
            }
            var returnStr = '+OK\r\n';
            for (let i=8 ; i < listStr.length; i+=2){
                //console.log(i)
                if (validSetOptions.has(listStr[i])){
                    if (listStr[i].toUpperCase() === "EX") {

                        if(listStr[i+2] && Number.isInteger(Number(listStr[i+2]))){
                            exSec = Number(listStr[i+2])
                            expiryTime =  Date.now()+(Number(listStr[i+2])*1000)
                        i += 2
                        }
                        else{
                            //console.log("EX error")
                            connectionFlag = 0
                            connection.write("-ERR Please specify the time! \r\n"); 
                        }
                    }

                    else if (listStr[i].toUpperCase() === "PX") {

                        if(listStr[i+2] && Number.isInteger(Number(listStr[i+2]))){
                            exMSec = Number(listStr[i+2])
                            expiryTime =  Date.now()+Number(listStr[i+2])
                        i += 2
                        }
                        else{
                            connectionFlag = 0
                            connection.write("-ERR Please specify the time! \r\n"); 
                        }
                    }

                    else if (listStr[i].toUpperCase() === "NX"){
                        if (key in dict){
                            if (TTL[key]){
                                var time = TTL[key]
                                if (Date.now() > time){
                                    delete dict[key]
                                    delete TTL[key]
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
                            if (TTL[key]){
                                var time = TTL[key]
                                if (Date.now() > time){
                                    keyDNE = 1
                                    deleteKey = 1
                                    connectionFlag = 0
                                }
                            }
                        }
                    }

                    else if (listStr[i].toUpperCase() === "KEEPTTL"){
                        //console.log("KEEPTTL")
                        if (key in dict){
                            if (TTL[key]) {
                                var time = TTL[key]
                                if (Date.now() > time){
                                    keyDNE = 1
                                    deleteKey = 1
                                    connectionFlag = 0
                                }
                                else{
                                    expiryTime = time
                                }
                            }
                        }
                        else {
                            keyDNE = 1
                            connectionFlag = 0
                        }
                    }

                    else if (listStr[i].toUpperCase() === "GET"){
                        if (key in dict){
                            // value["ttl"] = dict[key]["ttl"]
                            // if(ExpirySec[key] || ExpiryMSec[key]){
                            //     let unit = ExpirySec[key] ? "s" : "ms";
                            //     if (unit == "s"){
                            //         var time = ExpirySec[key]
                            //         var insertTime = insertionTime[key]
                            //         let timeDiffMillisec = (Date.now() - insertTime)/1000;
                            //         //console.log(timeDiffMillisec)
                            //         if (timeDiffMillisec > time){
                            //             // delete dict[key];
                                        // keyDNE = 1
                                        // deleteKey = 1
                                        // connectionFlag = 0
                            //         }
                            //     }
                            //     else if (unit == "ms"){
                            //         var time = ExpiryMSec[key]
                            //         var insertTime = insertionTime[key]
                            //         let timeDiffMillisec = Date.now() - insertTime;
                            //         if (timeDiffMillisec > time){
                            //             keyDNE = 1
                            //             deleteKey = 1
                            //             connectionFlag = 0
                            //         }
                            //     }
                            // }
                            if (TTL[key]) {
                                var time = TTL[key]
                                if (Date.now() > time){
                                    keyDNE = 1
                                    deleteKey = 1
                                    connectionFlag = 0
                                }
                            }
                            returnStr = "$" + dict[key].length + "\r\n"+ dict[key] + "\r\n"
                            //console.log(returnStr);
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
            if (connectionFlag && value){
                dict[key] = value
                if (expiryTime){
                    TTL[key] = expiryTime
                }
                else if (TTL[key]){
                    delete TTL[key]
                }
                //console.log(dict)
                //console.log(TTL)
                //console.log("--------------------------------")
                isDataDirty = true
                connection.write(returnStr);
            }

            else{
                if (deleteKey){
                    isDataDirty = true
                    delete dict[key]
                    if (TTL[key]){
                        isDataDirty = true
                        delete TTL[key]
                    }
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
            if (TTL[key]) {
                var time = TTL[key]
                if (Date.now() > time){
                    delete dict[key];
                    delete TTL[key]
                }
            }
        }
        if (dict[key] && listStr.length == 6){
            restr = formatConfigMessage(dict[key])
            connection.write(restr); 
        }
        else {
            connection.write('$-1\r\n'); 
        }
    }

    else if (cmd === "config"){
        connection.write(configCMD(listStr,config));
    }

    else if (cmd === "lpush"){
        const [,,,command,key,...elements] = listStr
        const list = elements.filter(item => !isNaN(item) && item !== '');
        list.reverse();
        // value = {"value":null, "ttl":-1}
        if(!dict[key]){
            dict[key] = list;
            isDataDirty = true
            connection.write(formatMessage("OK"))
        }
        else{
            if (Array.isArray(dict[key])){
                dict[key] = dict[key].concat(list);
                isDataDirty = true
                connection.write(formatMessage("OK"));
            }
            else{
                connection.write("-ERR Value is not a list!\r\n")
            }
        }
        //console.log(value)
    }

    else if (cmd === "lrange") {
        const [,,command,,key,,startIndex,,endIndex] = listStr;
        //console.log(command,key,startIndex,endIndex)
        if (!(key in dict)){
            connection.write('-ERR Key does not exists!\r\n')
        }
        else{
        if (Array.isArray(dict[key])) {
            const start = parseInt(startIndex, 10);
            const end = parseInt(endIndex, 10);
            const listLength = dict[key].length;
            const validEnd = end >= listLength ? listLength - 1 : end;
            const result = dict[key].slice(start, validEnd + 1);
            var formattedResult = `*${result.length}\r\n`
            for (let i=start; i<= validEnd; i+=1){
                //console.log(formatConfigMessage(dict[key][i]))
                formattedResult += formatConfigMessage(dict[key][i])
            }    
            connection.write(formattedResult);
        } else {
            connection.write("-ERR Value is not a list!\r\n");
        }
    }
    }
    
    else if (cmd === "save") {
        const dir = fileDir;
        const p = fileName;
        const filePath = dir + '/' + p
        saveToRDB(dir,p,filePath,connection,dict,TTL)
    }

    else if (cmd === "keys") {
        const [,,,command,pattern] = listStr
        //console.log(pattern)
        const response = match_keys(dict,pattern)
        connection.write(response)
    }

    else if (cmd === "-p"){
        const [,,,command,Instanceport,,info,,replication] = listStr;
        //console.log("---------------------------------")
        //console.log(Instanceport,info,replication);
        //console.log("----------------------------------")
        if (info.toLowerCase()==="info" && replication.toLocaleLowerCase()==="replication"){
            const configDetails = replicaSet[Instanceport] 
            const res = toRESPArray(Object.entries(configDetails).map(([key, value]) => `${key}:${value}`));
            connection.write(res)
        }
        
    }

    else if (cmd === "replconf"){
        if (listStr[4] === "listening-port"){
        const slavePort = listStr[6]
        updateReplicas(slavePort,"slave")
        connections_record[slavePort] = connection;
        connection.write("+OK\r\n")
        }
        else{
            connection.write("+OK\r\n")
        }
    }

    else if (cmd === "psync") {
        const id = replicaSet[masterPort]["master_replid"]
        isSlave = true;
        console.log("remote slave port=", port)
        const dir = fileDir;
        const p = fileName;
        const filePath = dir + '/' + p
        saveToRDB(dir,p,filePath,connection,dict,TTL)
        connection.write(`+FULLRESYNC ${id} 0\r\n`)
    }

    else if (cmd.toUpperCase() === "START_RDB_TRANSFER") {
        isRDBTransfer = true;
        const rdbFilePath = './tmp/redis-files/' + finalPort + '/RDB.rdb';
        if (!fs.existsSync(rdbFilePath)) {
            fs.mkdirSync(rdbFilePath, { recursive: true });
        }
        console.log("-----recievied the start rdb trans------")
    }
    else if(isRDBTransfer) {
        const rdbFilePath = './tmp/redis-files/' + finalPort + '/RDB.rdb';
        if (!fs.existsSync(rdbFilePath)) {
            fs.mkdirSync(rdbFilePath, { recursive: true });
        }
        const writeStream = fs.createWriteStream(rdbFilePath);
        if (connection.remoteAddress === masterPort){
            connection.pipe(writeStream);
            writeStream.on('finish', () => {
                console.log('RDB file received and saved successfully!');
                load(1,rdbFilePath);
                writeStream.kill()
                console.log('--------------From slave-------------')
                console.log(dict)
                console.log("-----------copied from master------------")
            });
        
            // Handle errors in the data transfer process
            writeStream.on('error', (err) => {
                console.error('Error during file transfer:', err);
            });
        isRDBTransfer = false;

        }
        else {
            connection.write('-ERR not allowed!')
        }
    }
    else{
        connection.write("-ERR Unknown Command!\r\n");
    }
})


    connection.on("end", () => {
        //console.log("Client disconnected");
      })
});

server.on('exit', () => {
    //console.log("Server closed gracefully.");
    server.close();
  })

server.listen(finalPort, "127.0.0.1", ()=>{
    logger.log("Server is running at 127.0.0.1")
    //console.log(serverType)
    updateReplicas(port,serverType)
    logger.log(finalPort)
    load(0,"")
    //console.log("hey there")
});

server.on("error", (err) => {
    //console.log("Server error:", err);
});

