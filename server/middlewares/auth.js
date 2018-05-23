var express = require("express");

var logger = require("../../utils/log").getLogger("middlewares.auth");
var SErrors = require("../../utils/error");

var router = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        logger.log("debug", "commands from user not logged in", logger.TYPE.RUN);
        req._SError = SErrors.LogicError("session time out");
        next();
    }
};

module.exports = router;
