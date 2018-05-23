let express = require('express');
let router = express.Router();
let node = require('../models/node');

router.post('/node/add', function (req, res) {
    let data = req.body;

    let newNode = {};
    if (data.parent) {
        newNode.parent = data.parent;
    }
    if (data.description) {
        newNode.description = data.description;
    }
    new node(newNode).save(function (error, node) {
        if (error) {
            console.log('Create node error: ', error);
            res.send('Create node failed!');
        }
        console.log('Create node success!');
        res.send(node);
    });
})

router.get('/node/tree', function (req, res) {
    let data = req.params;

    let query = data || {};
    console.log('***** query ****');
    console.log(query);
    console.log('***** ***** ****');
    node.find(query)
        .exec()
        .then(function (nodes) {

            let result = {
                code: 0,
                data: nodes
            };
            console.log(result);
            res.send(JSON.stringify(result));
        })
        .catch(function (error) {
            console.log('Get node error: ', error);
            res.send('Get node failed!');
        })

})

module.exports = router;
