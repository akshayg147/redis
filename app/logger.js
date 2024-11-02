// const debugNamespaces = (proccess.env.DEBUG || '*')
//     .split(",")
//     .map((ns) => ns.trim());

const logger = (namespace) => {
    const log = (mode,message) => {
        console[mode](mode + ": " + message)
    };
    return {
        log: (message) => log("log",message),
        error: (message) => error("error",message),
        warn: (message) => log("warn",message),
        debug: (message) => log("debug",message),
    };
};

module.exports = logger;