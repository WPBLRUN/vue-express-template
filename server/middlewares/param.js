var formidable = require("formidable");

var logger = require("../../utils/log").getLogger("middlewares.param");
var SErrors = require("../../utils/error");
var User = require('../models/user');

/**
 * try to parse request data and stored them in req._SParam
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
var router = function (req, res, next) {
    if (req.session.user) {
        req._SUser = req.session.user;
        return next();
    }
    var userId = req.headers["user-id"];
    if (!userId) {
        logger.log("error", "Request from invalid user", logger.TYPE.RUN);
        req._SError = SErrors.ParameterInvalidError("User is invalid");
        return next();
    }

    User.findById(userId)
        .populate({
            path: "roles",
            select: "-__v"
        })
        .select("-password -removed -__v")
        .then(
            function (user) {
                if (!user) {
                    logger.log("error", "Request from invalid user @ " + userId, logger.TYPE.RUN);
                    req._SError = SErrors.ParameterInvalidError("User is invalid");
                    return next();
                }

                logger.log("info", "Command from user @ id: " + user.id + " name: " + user.username, logger.TYPE.RUN);
                req._SUser = user;

                var type = req.get("content-type");
                type = !type ? "" : type.toLowerCase();
                if (type.startsWith("multipart/form-data") ||
                    type.startsWith("application/x-www-form-urlencoded")) {
                    var form = new formidable.IncomingForm({multiples: true});
                    form.parse(req, function (error, fields, files) {
                        if (error) {
                            logger.log("error", "Failed to parse parameter @ " + error.message, logger.TYPE.RUN);
                            req._SError = SErrors.ParameterInvalidError("Form parameter parsing error");
                            return next();
                        }

                        req._SParam = {
                            fields: fields,
                            files: files
                        };
                        return next();
                    });
                } else {
                    return next();
                }
            },
            function (error) {
                logger.log("error", "Failed to find user @ " + error.message, logger.TYPE.RUN);
                req._SError = SErrors.DBOperationError(error.message);
                return next();
            }
        );
};

module.exports = router;
