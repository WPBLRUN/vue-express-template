/**
 * Created by CaiNick on 2017-07-25.
 */
var Key = require("./models/key");

module.exports.initKeys = function (callback) {
    Key.find({removed: false})
        .then(function (keys) {
            global.keys = {};
            keys.forEach(function (key) {
                global.keys[key.server] = {
                    appId: key.appId,
                    appKey: key.appKey,
                    userId: key.userId
                };
            });
            callback();
        }, function (error) {
            callback(error);
        });
};
