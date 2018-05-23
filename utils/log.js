var winston = require("winston");

function Logger (module) {
    this.module = module;
}

Logger.prototype.TYPE = {
    RUN: "run"
};

Logger.prototype.log = function (level, msg, type, meta) {
    if (!meta) {
        meta = {};
    }
    meta.mod = this.module;
    if (type) {
        meta.type = type;
    }

    winston.log(level, msg, meta);
};

exports.getLogger = function (module) {
    return new Logger(module);
};

exports.setLogLevel = function (level) {
    winston.level = level;
};
