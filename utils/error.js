var SsiError = function (code, msg) {
    this.code = code;
    this.message = msg;
    Error.captureStackTrace(this, SsiError);
};

var ContentTypeInvalid = new SsiError(2, "Content-Type should be application/json");
var ServerError = new SsiError(3, "Server error");

var errorLib = {
    SsiError: SsiError,

    ParameterInvalidError: function (msg) {
        return new SsiError(1, msg);
    },

    ContentTypeInvalidError: function () {
        return ContentTypeInvalid;
    },

    ServerError: function () {
        return ServerError;
    },

    DBOperationError: function (msg) {
        return new SsiError(4, msg);
    },

    PathInvalidError: function (msg) {
        return new SsiError(5, msg);
    },

    LogicError: function (msg) {
        return new SsiError(6, msg);
    },

    DataInvalidError: function (msg) {
        return new SsiError(7, msg);
    },

    UserInvalidError: function (msg) {
        return new SsiError(8, msg);
    },
};

module.exports = errorLib;
