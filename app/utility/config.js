function formatConfigMessage(key = '', value = '') {
	return `*2\r\n$${key.length}\r\n${key}\r\n$${value.length}\r\n${value}\r\n`;
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

module.exports = { configCMD };