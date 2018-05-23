/**
 * Created by Jintao on 2018-03-20.
 */
var md5 = require("md5");
var _ = require("lodash");

module.exports = {
    getValidatorError: function (validator) {
        return validator.errors.map(function (error) {
            return error.path + ": " + error.keyword;
        }).join(",");
    },
    isValidIp: function (ip) {
        return /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}$/.test(ip);
    },
    formatDate: function (date, fmt) {
        var o = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "S": date.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    },
    parseBool: function (str) {
        return !(/^(false|0)$/i).test(str);
    },
    getRandom: function (len) {
        len = len || 32;
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
        var pwd = '';
        for (var i = 0; i < len; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pwd;
    },
    dataToQuery: function (data, sort, exclude) {
        var sDic = Object.keys(data);
        if (sort) sDic.sort();
        var query = "";
        for (var key in sDic) {
            var dicKey = sDic[key];
            if (exclude && exclude.indexOf(dicKey) !== -1) continue;
            var keyData = data[dicKey];
            if (typeof keyData === 'object') {
                keyData = JSON.stringify(keyData);
            }
            query += dicKey + "=" + keyData + "&";
        }
        return query.replace(/&$/, "");
    },
    getSign: function (dataStr, apiKey) {
        return md5(dataStr + "&key=" + apiKey).toUpperCase();
    },
    getQueryWithSign: function (data, appId, appKey) {
        data.appid = appId;
        data.random = this.getRandom(16);
        data.sign = this.getSign(this.dataToQuery(data, true), appKey);
        return this.dataToQuery(data);
    },
    signData: function (data, appId, appKey) {
        data.appid = appId;
        data.random = this.getRandom(16);
        data.sign = this.getSign(this.dataToQuery(data, true), appKey);
    },
    paramHandler: function (param) {
        ret = {};
        if (!param) return ret;

        ["query", "select", "populate", "limit", "skip", "sort"]
            .forEach(function (key) {
                if (param[key]) {
                    ret[key] = JSON.stringify(param[key]);
                }
            });
        return ret;
    },
    getDayStart: (date, days) => {
        let dayStart = date ? new Date(date) : new Date();
        days && dayStart.setDate(dayStart.getDate() - days);
        dayStart.setHours(0);
        dayStart.setMinutes(0);
        dayStart.setSeconds(0);
        dayStart.setMilliseconds(0);
        return dayStart;
    },
    getDayEnd: (date, days) => {
        let dayEnd = date ? new Date(date) : new Date();
        dayEnd.setDate(dayEnd.getDate() + (days || 0));
        dayEnd.setHours(23);
        dayEnd.setMinutes(59);
        dayEnd.setSeconds(59);
        dayEnd.setMilliseconds(999);
        return dayEnd;
    },
    getUserServer: function (config) {
        return config.USERSERVER;
    },
    getFileServer: function (config) {
        return config.FILESERVER;
    },
    getDmpServer: function (config) {
        return config.DMPSERVER;
    },
    getAdxServer: function (config) {
        return config.ADXSERVER;
    },
    getBoxApiServer: function (config) {
        return config.BOXAPISERVER;
    },
    getAdminName: function (config) {
        return config.ADMIN || 'boxAdmin'
    },
    getDownloadServerUrl: function (config) {
        return config.DOWNLOAD_SERVER_URL || config.FILESERVER;
    },
    editReviewMessage: function (message) {
        let reviewName = this.getReviewType(message.type) + ' "' + message.title + '" ';
        let reviewStatus = message.reviewStatus === 'pass';
        let statusMark = reviewStatus ? '<span class="review-success">已通过</span>' : '<span class="review-err">未通过</span>';
        let obj = {
            type: message.type,
            recipient: message.recipient,
            title: '<span>' + this.getReviewType(message.type) + ' "' + this.checkMessageTitleLength(message.title) + '" ' + '审核' +  statusMark + '</span>'
        };
        if (reviewStatus) {
            obj.content = '<h3>尊敬的' + message.username + ':</h3><p>您好, 您提交的' + reviewName + '审核已通过</p><a>点击查看</a>'
        } else {
            obj.content = '<h3>尊敬的' + message.username + ':</h3><p>您好, 您提交的' + reviewName + '由于 "' + message.reason + '" 的原因审核未通过, 请仔细检查您的素材是否存在上述问题。</p><a>点击查看</a>';
        }
        return obj;
    },
    getReviewType: function (type) {
        let obj = {
            "materialReview": '素材',
            "programReview": '节目'
        };
        return obj[type];
    },
    checkMessageTitleLength:  function (name) {
        let max = 20;
        if (name.length > max) {
            return name.slice(0, max) + '...';
        }
        return name;
    },
    editExpireMessage: function (message) {
        return {
            type: message.type,
            recipient: message.recipient,
            title: '<span>' + message.msgType + ' "'+ this.checkMessageTitleLength(message.title) + '" 还有' + '<span class="mark-red">' + message.interDays + '</span>天到期。</span>',
            content: '<h3>尊敬的' + message.username + ':</h3><p>您好, 您提交的' + message.msgType + ' "' + message.name + '" 还有' + message.interDays + '天到期, 请及时更换素材。</p><a>点击查看</a>'
        }
    },
    getHierarchyLevel: function (hierarchy) {
        let max = _.keys(hierarchy).length - 1;
        return 'level_' + max;
    },
    getMediaAttributeKey: function () {
        return process.env["MEDIA_ATTRIBUTE_KEY"] || "0002";
    },
    getMediaCategoryLevel1: function () {
        return process.env["MEDIA_CATEGORY_LEVEL_1"] || "110000";
    },
    getMediaCategoryLevel2: function () {
        return process.env["MEDIA_CATEGORY_LEVEL_2"] || "110100";
    },
    roundNum: function (number, bit) {
        number = parseFloat(number);
        bit = parseInt(bit);
        if (isNaN(number) || isNaN(bit)) return;
        let pow = Math.pow(10, bit);
        number = Math.round(number * pow) / pow;
        return number;
    }

};
