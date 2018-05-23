// import api
// const api = require('./api');
const api = require('./routers/api');

// import file module
const fs = require('fs');

// import path module
const path = require('path');

// import post data handle module
const bodyParser = require('body-parser');

// import express
const express = require('express');

const app = express();


//db
let mongoose = require("mongoose");

mongoose.Promise = require('q').Promise;
let options = {
};
mongoose.connect("mongodb://127.0.0.1:27017/myVueDb", options)
    .catch(function (err) {
        console.error("DB connection error: " + err.message);
        process.exit(-1);
    });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(api);

// request static resources file path 'dist'
app.use(express.static(path.resolve(__dirname, '../dist')));

// because this is single page app, all request access /dist/index/html
//解决跨域
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    const html = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), 'utf-8');
    res.send(html);
});

// listen port
app.listen(8088);
console.log('success listen........');
