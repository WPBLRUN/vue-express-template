var jsen = require('jsen');
var path = require('path');
var q = require("q");
var _ = require("lodash");
var async = require("async");

var TAG = path.basename(__filename, '.js');

var logger = require("../utils/log").getLogger(TAG);
var SErrors = require("../utils/error");
var Util = require("../utils/util");
var Device = require("./models").device;
var DeployRecord = require("./models").deployRecord;

function DeployRecordManager () {
    this.getPlaylistValidator = jsen(require("./routers/schemas/get-playlist-schema.json"));
    this.getPlaylistsValidator = jsen(require("./routers/schemas/get-playlists-schema.json"));
    this.playlistCountValidator = jsen(require("./routers/schemas/playlist-count-schema.json"));
}

DeployRecordManager.prototype.getPlaylists = function (req) {
    var data = req.query;
    if (!this.getPlaylistsValidator(data)) {
        var errMsg = Util.getValidatorError(this.getPlaylistsValidator);
        logger.log("error", "Invalid get deployed playlists request @ " + errMsg, logger.TYPE.RUN);
        return q.reject(SErrors.ParameterInvalidError(errMsg));
    }

    var defer = q.defer();

    // 1. Init query and option.
    let hierarchyInfo = JSON.parse(data.hierarchyInfo);
    var deployRecordQuery = {
        $or: [
            {"deployInfo.hierarchyLevel1": hierarchyInfo['hierarchyLevel1']},
        ]
    };

    if (data.name) {
        deployRecordQuery.title = {$regex: data.name, $options: 'i'};
    }
    if (hierarchyInfo.hierarchyLevel2) {
        deployRecordQuery.$or.push({"deployInfo.hierarchyLevel2": hierarchyInfo['hierarchyLevel2']});
    }
    if (hierarchyInfo.hierarchyLevel3) {
        deployRecordQuery.$or.push({"deployInfo.hierarchyLevel3": hierarchyInfo['hierarchyLevel3']});
    }

    var options = {};
    if (data.skip) options.skip = parseInt(data.skip);
    if (data.limit) options.limit = parseInt(data.limit);
    options.sort = {createdAt : -1};

    // 2. Find devices by hierarchy.
    let hierarchy = JSON.parse(data.hierarchy);
    let deviceQuery = {
        [hierarchy.key]: hierarchy.value
    }
    Device.find(deviceQuery, '_id cpuSerial')
        .then(function (devices) {
            // 3. Assemble query by devices and hierarchy info.
            let deviceIds = devices.map(device => {
                return device._id
            });
            deployRecordQuery.$or.push({
                "deployInfo.devices": {
                    $in: deviceIds
                }
            });
            // 4. Find deploy records by query.
            DeployRecord.find(deployRecordQuery, null, options)
                .select({
                    _id: 1,
                    title: 1,
                    hierarchyTag: 1,
                    pages: 1,
                    deployInfo: 1,
                    hierarchy: 1,
                    scheduleType: 1,
                    schedule_start: 1,
                    schedule_end: 1,
                    userId: 1,
                    priority: 1,
                    createdAt: 1
                })
                .then(function (records) {
                    if (!records) {
                        var errMsg = "No deployed playlists found!";
                        logger.log("error", errMsg, logger.TYPE.RUN);
                        return defer.reject(SErrors.LogicError(errMsg));
                    }
                    defer.resolve(records);
                }, function (error) {
                    logger.log("error", "Failed to find deployed playlists @ " + error.message, logger.TYPE.RUN);
                    defer.reject(error);
                });
        }, function (error) {
            logger.log("error", "Failed to find devices when get deployed playlists @ " + error.message, logger.TYPE.RUN);
            defer.reject(error);
        });

    return defer.promise;
};

DeployRecordManager.prototype.count = function (req) {
    var data = req.query;
    if (!this.playlistCountValidator(data)) {
        var errMsg = Util.getValidatorError(this.playlistCountValidator);
        logger.log("error", "Invalid get playlists count request @ " + errMsg, logger.TYPE.RUN);
        return q.reject(SErrors.ParameterInvalidError(errMsg));
    }

    var defer = q.defer();

    // 1. Init query.
    let hierarchyInfo = JSON.parse(data.hierarchyInfo);
    var deployRecordQuery = {
        $or: [
            {"deployInfo.hierarchyLevel1": hierarchyInfo['hierarchyLevel1']},
        ]
    };

    if (data.name) {
        deployRecordQuery.title = {$regex: data.name, $options: 'i'};
    }
    if (hierarchyInfo.hierarchyLevel2) {
        deployRecordQuery.$or.push({"deployInfo.hierarchyLevel2": hierarchyInfo['hierarchyLevel2']});
    }
    if (hierarchyInfo.hierarchyLevel3) {
        deployRecordQuery.$or.push({"deployInfo.hierarchyLevel3": hierarchyInfo['hierarchyLevel3']});
    }

    // 2. Find devices by hierarchy.
    let hierarchy = JSON.parse(data.hierarchy);
    let deviceQuery = {
        [hierarchy.key]: hierarchy.value
    }
    Device.find(deviceQuery, '_id cpuSerial')
        .then(function (devices) {
            // 3. Assemble query by devices and hierarchy info.
            let deviceIds = devices.map(device => {
                return device._id
            });
            deployRecordQuery.$or.push({
                "deployInfo.devices": {
                    $in: deviceIds
                }
            });
            // 4. Count deploy records by query.
            DeployRecord.count(deployRecordQuery)
                .then(function (count) {
                    defer.resolve({count});
                }, function (error) {
                    logger.log("error", "Failed to count deployed playlists @ " + error.message, logger.TYPE.RUN);
                    defer.reject(error);
                });
        }, function (error) {
            logger.log("error", "Failed to find devices when get deployed playlists' count @ " + error.message, logger.TYPE.RUN);
            defer.reject(error);
        });

    return defer.promise;
};

DeployRecordManager.prototype.getPlaylist = function (req) {
    var data = req.query;
    if (!this.getPlaylistValidator(data)) {
        var errMsg = Util.getValidatorError(this.getPlaylistValidator);
        logger.log("error", "Invalid get deployed playlist request @ " + errMsg, logger.TYPE.RUN);
        return q.reject(SErrors.ParameterInvalidError(errMsg));
    }
    var defer = q.defer();

    DeployRecord.findById(data.id)
        .then(function (playlist) {
            let query = {
                test: false,
                isEnabled: true,
                $or: []
            };
            let deployInfo = playlist.deployInfo;
            if (deployInfo.hierarchyLevel1.length > 0) {
                query.$or.push({
                    'hierarchy.level_1': {$in: deployInfo.hierarchyLevel1}
                });
            }
            if (deployInfo.hierarchyLevel2.length > 0) {
                query.$or.push({
                    'hierarchy.level_2': {$in: deployInfo.hierarchyLevel2}
                });
            }
            if (deployInfo.hierarchyLevel3.length > 0) {
                query.$or.push({
                    'hierarchy.level_3': {$in: deployInfo.hierarchyLevel3}
                });
            }
            if (deployInfo.devices.length > 0) {
                query.$or.push({
                    '_id': {$in: deployInfo.devices}
                });
            }
            if (query.$or.length < 1) {
                playlist._doc.deployedDeviceCount = 0;
                defer.resolve(playlist);
                return;
            }
            Device.count(query)
                .then(function (count) {
                    playlist._doc.deployedDeviceCount = count;
                    defer.resolve(playlist);
                }, function (error) {
                    logger.log("error", "Failed to count deployed device @ " + error.message, logger.TYPE.RUN);
                    playlist._doc.deployedDeviceCount = 0;
                    defer.resolve(playlist);
                });
        },function (error) {
            defer.reject(SErrors.ServerError());
        });
    return defer.promise;
};

module.exports = DeployRecordManager;
