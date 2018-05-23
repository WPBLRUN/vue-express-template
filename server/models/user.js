var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var utils = require('../../utils/util');

var schema = new Schema(
    {
        username: {
            type: String,
            unique: true,
            required: true
        },
        rtbStatus: {
            type: String,
            required: true
        },
        media: {            // user media id in adx system, according with medirPrefix
            type: String,
            required: true
        },
        mediaPrefix: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        nickName: {
            type: String
        },
        avatar: {
            type: Schema.Types.ObjectId
        },
        hierarchy: {
            level_0: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            },
            level_1: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            },
            level_2: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            },
            level_3: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            },
            level_4: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            },
            level_5: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            },
            level_6: {
                type: Schema.Types.ObjectId,
                ref: "hierarchy"
            }
        },
        removed: {
            type: Boolean,
            default: false
        }
    },
    {toJSON: {virtuals: true}}
);

schema.virtual("avatarUrl").get(function () {
    if (this.avatar) {
        return utils.getFileServer(global.config) + "/api/read/" + this.avatar;
    } else {
        return undefined;
    }
});

module.exports = mongoose.model("user", schema);
