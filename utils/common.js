/**
 * Created by xiaohua.Mao on 2018/5/11.
 */
var async = require('async');

var Material = require("../server/models/material");

var logger = require("./log").getLogger("models.deployRecord");

module.exports = {
    setMaterialRefCount (oldMaterials, newMaterials, updateField) {
        let updateMatArr = [];
        if (oldMaterials && oldMaterials.length) {
            oldMaterials.forEach(mat => {
                if (newMaterials.indexOf(mat) !== -1) return;
                updateMatArr.push({
                    id: mat,
                    count: -1
                });
            })
        }

        if (newMaterials && newMaterials.length) {
            newMaterials.forEach(mat => {
                if (oldMaterials.indexOf(mat) !== -1) return;
                updateMatArr.push({
                    id: mat,
                    count: 1
                });
            })
        }

        let update = {
            $inc: {}
        };

        async.eachSeries(updateMatArr, function (updateMat, callback) {
            update.$inc[updateField] = updateMat.count;
            Material.findOneAndUpdate({_id: updateMat.id}, update)
                .then(res => {
                    callback();
                })
                .catch(err => {
                    callback(err);
                })
        }, function (err) {
            if (err) {
                return logger.log("error", "update material " + updateField + " error @ " + err.message, logger.TYPE.RUN);
            }
            logger.log("success", "update material " + updateField +" success");
        });
    }
};
