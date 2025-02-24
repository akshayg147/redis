const { redisInfo,replicaSet } = require('../config/replicas');

function updateReplicas(port,role){
    var newRedisInfo = redisInfo;
    newRedisInfo["role"] = role;
    if(role == "master"){
    replicaSet["masterPort"] = replicaSet
    newRedisInfo["master_replid"] = "8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb"
    newRedisInfo["master_repl_offset"] = 0
    }
    replicaSet[port] = newRedisInfo
    

}

module.exports = { updateReplicas }