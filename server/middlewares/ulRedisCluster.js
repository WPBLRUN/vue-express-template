/**
 * Created by Felix on 2017/01/10.
 */
var Redis = require('ioredis');

/**
 * Constructor of ul redis cluster
 *
 * @param url  redis nodes url, url = 127.0.0.1:7001[,127.0.0.1:7002,...]
 * @constructor
 */
function UlRedisCluster(url) {
    // redisNodes is array of nodes, node = {host:xxx,port:xxx}
    var redisNodes = [];
    url.split(",").forEach(function (node) {
        var nodeConf = node.split(":");
        redisNodes.push({host : nodeConf[0], port : nodeConf[1]});
    });

    this.redisClient = new Redis.Cluster(redisNodes, {enableReadyCheck:true});
}

module.exports = UlRedisCluster;
