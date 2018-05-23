var express = require("express");
var request = require("request");
var url = require("url");

var logger = require("../../utils/log").getLogger("middlewares.proxy");
var Util = require("../../utils/util");

const params = ["query", "select", "populate", "limit", "skip", "sort"];

function getServer (config, name) {
    switch (name) {
        case "user":
            return Util.getUserServer(config);
        case "wx":
            return Util.getWxServer(config);
        case "adx":
            return Util.getAdxServer(config);
        case "dmp":
            return Util.getDmpServer(config);
        case "file":
            return Util.getFileServer(config);
        case "boxApi":
            return Util.getBoxApiServer(config);
    }
}

function redirectTo (name) {
    var router = express.Router();

    router.use(function (req, res, next) {
        var server = {host: getServer(global.config, name)};
        var key = global.keys[name];
        if (key) {
            server.appId = key.appId;
            server.appKey = key.appKey;
            server.userId = key.userId;
        }
        var fullPath = req.originalUrl;
        var basePath = req.baseUrl;

        var redirectUrl = "";
        if (name === "boxApi") {
            redirectUrl = server.host + fullPath;
        } else {
            redirectUrl = server.host + fullPath.substr(basePath.length);
        }

        var type = req.get("content-type");
        type = !type ? "" : type.toLowerCase();

        if (name !== "wx" ||
            type.indexOf("application/x-www-form-urlencoded") !== -1 ||
            type.indexOf("multipart/form-data") !== -1) {
            if (!req.headers["user-id"]) req.headers["user-id"] = server.userId;
            return req.pipe(
                request({
                    url: redirectUrl
                })
                    .on("error", function (error) {
                        logger.log("error", "Failed to proxy @ " + error.message, logger.TYPE.RUN);
                        return res.send(500, "Server Internal Error");
                    })
            ).pipe(res);
        }

        var options = {method: req.method};
        var data;
        if (req.method === "GET" || req.method === "DELETE") {
            if (!req.query) req.query = {};
            params.forEach(function (key) {
                if (req.query[key]) {
                    req.query[key] = JSON.parse(req.query[key]);
                }
            });
            data = req.query;
            Util.signData(data, server.appId, server.appKey);

            var urlObject = url.parse(redirectUrl, true);
            delete urlObject.search;
            params.forEach(function (key) {
                if (data[key]) {
                    data[key] = JSON.stringify(data[key]);
                }
            });
            urlObject.query = data;
            redirectUrl = url.format(urlObject);
        } else {
            if (!req.body) req.body = {};
            data = req.body;
            Util.signData(data, server.appId, server.appKey);

            options.body = data;
            options.json = true;
        }

        options.url = redirectUrl;
        request(options)
            .on("error", function (error) {
                logger.log("error", "Proxy error @ " + error.message, logger.TYPE.RUN);
                return res.send(500, "Server Internal Error");
            })
            .pipe(res);
    });

    return router;
}

module.exports = redirectTo;
