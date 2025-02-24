const fs = require('fs');
const path = require('path');

var fileDir = null
var dbFilePath = null
var fileName = null
var port = null
var error = 0
function setArguments(arguments) {
for( var ind=0; ind < arguments.length; ind++){
    if (arguments[ind].toLowerCase() == "--dir"){
        fileDir = arguments[ind+1]
        if (!fs.existsSync(fileDir)){
            fs.mkdirSync(fileDir, { recursive: true });
        }
    }
    if (arguments[ind].toLowerCase() == "--dbfilename"){
        fileName = arguments[ind+1]
        if(fileDir){
            dbFilePath = fileDir + '/' + fileName
            if(!fs.existsSync(dbFilePath)){
                error = 1
            }
        }
    }
    if (arguments[ind] == "--port"){
        if(ind+1 < arguments.length){
        port = arguments[ind+1]
        }
        else{
            error = 1
        }
    }
}
console.log(fileDir)
return { fileDir,fileName,port,error }
}


module.exports = { setArguments };