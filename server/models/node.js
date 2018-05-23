var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    ancestors: {
        type: [Schema.Types.ObjectId],
        ref: 'node'
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'node'
    },
    description: {
        type: String
    },
    total: {
        type: Number,
        default: 10
    },
    done: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("node", schema);
