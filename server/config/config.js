// Default
var defaultCfg = {
    "SECRET": "Box server broadcast control system",
    "MONGO": "mongodb://127.0.0.1:27017/myVueDb",
    "LOG": "debug",
    "DBUSER" : "",
    "DBPASSWORD" : "",
    "REDIS": "node1:port,node2:port",
    "PORT" : "3000",
    "USERSERVER": "http://host:port",
    "FILESERVER": "http://host:port",
    "DMPSERVER": "http://host:port",
    "ADXSERVER": "http://host:port",
    "BOXAPISERVER": "http://host:port",
    "DOWNLOAD_SERVER_URL": "",
    "MAILSERVER": "smtp://host:port"
};

/**
 * Read configuration from Env or Default
 *
 */
exports.readCfg = function () {
    var ret = {},
        env;
    Object.keys(defaultCfg).forEach(function (key) {
        env = process.env[key];
        if (env) {
            ret[key] = env;
        } else {
            ret[key] = defaultCfg[key];
        }
    });
    return ret;
};
