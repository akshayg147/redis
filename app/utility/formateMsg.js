function formatConfigMessage(key = '', value = '') {
	return `*2\r\n$${key.length}\r\n${key}\r\n$${value.length}\r\n${value}\r\n`;
}

function toRESPArray(list) {

    let resp = `*${list.length}\r\n`;
  

    list.forEach(item => {
      const str = String(item); // Ensure it's treated as a string
      resp += `$${str.length}\r\n${str}\r\n`;
    });
  
    return resp;
  }

function configCMD(listStr,config){
    if (listStr[4].toLowerCase() === "get"){
        const [, ,command, ,subcommand, ,value] = listStr;
        return formatConfigMessage(value, config.get(value));
    }
    else{
        return "-ERR ERROR!\r\n";
    }
}

module.exports = { toRESPArray, configCMD };