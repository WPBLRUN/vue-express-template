/***** Import Basic Modules *****/
// 1. Framework
// express
let express = require('express');

// 2. File Tools
// path
let path = require('path');

// 3. Develop Tools
// logger
let logger = require('morgan');     // http request logger
let winston = require("winston");
let appLogger = require("./utils/log").getLogger("app");

// 4. Database & Storage
// Mongoose Session
let session = require('express-session');
let MongoStore = require('connect-mongo')(session);

// 5. Http Tools
// cookie session body parser
let cookieParser = require('cookie-parser');
// let bodyParser = require('body-parser');


// 6. Parameter Check Tools
// jsen
let jsen = require("jsen");

// 7. Frontend Tools
// favicon style
let favicon = require('serve-favicon');
let stylus = require('stylus');  // there anther way to use stylus

/***** Init project *****/
// 1. Create express application
let app = express();

// 2. Set frontend view engine
// Actually we do not use view engine.
// app.set('views', path.jion(__dirname, 'views'));
// app.set('views engine', 'pug');

// 3. Set frontend and http middleware
// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// set http logger middleware
app.use(logger('dev'));
app.use(stylus.middleware(path.join(__dirname, 'public'))); // what for?  connection of stylus and 'public'
app.use(express.static(path.join(__dirname, 'public')));    // what for?


// 4. Read server environment configuration
let config = require("./server/config/config").readCfg();
let validate = jsen(require("./server/config/config-schema.json"));
if (validate(config)) {
    app.set("config", config);
    global.config = config;
} else {
    let errMsg = util.getValidatorError(validate);
    appLogger.log("error", "config invalid: " + errMsg, appLogger.TYPE.RUN);
    process.exit(-1);
}

// 5. Config log
require("./utils/log").setLogLevel(config["LOG"]);
winston.add(require("winston-daily-rotate-file"),
    {
        filename: (path.join(".", "log", "boxserver-web")),
        level: config["LOG"],
        datePattern: "yyyy-MM-dd.log",
        maxsize: 1024 * 1024 * 1024 * 1
    }
);

// 6. Config database
let mongoose = require("mongoose");
mongoose.Promise = require('q').Promise;
let options = {
    useMongoClient: true
};
if (config["DBUSER"] !== "" && config["DBPASSWORD"] !== "") {
    options.user = config["DBUSER"];
    options.pass = config["DBPASSWORD"];
}
mongoose.connect(config["MONGO"], options)
    .catch(function (err) {
        appLogger.log("error", "DB connection error: " + err, appLogger.TYPE.RUN);
        process.exit(-1);
    });
/* user session */
app.use(session({
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 7 * 24 * 60 * 60
    }),
    secret: app.get('config')["SECRET"]
}));

// 7. Init
// what for, how das it works?
/*let init = require("./server/init");

init.initKeys(function (error) {
    if (error) {
        appLogger.log("error", "Failed to init keys @ " + error.message, appLogger.TYPE.RUN);
        process.exit(-1);
    }
    appLogger.log("info", "Init keys is completed", appLogger.TYPE.RUN);
});*/


/*
*  简单的HTTP请求响应周期
*  1. 记录开始时间
*  2. 验证用户身份
*  3. 解析cookie并加载body
*  4. 根据路由返回不同业务处理结果
*  5. 没有命中路由返回404页面
*  6. 记录日志
*  7. 记录总共花费时间
*  8. 处理异常并显示页面
*/

// 8. Config server routers
// proxy secret public
// 8.1 Translate proxy
let proxyFactory = require("./server/middlewares/proxy");
app.use("/proxy/user", proxyFactory("user"));

// 8.2 Use middleware parse request
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));

// redis manager
let RedisManager = require("./server/redisManager"),
    redisMgr = new RedisManager(config["REDIS"]);
app.set("redisMgr", redisMgr);
global.redisMgr = redisMgr;

// 8.3 set routers
let DeployRecord = require("./server/deployRecordManager")
let deployRecordMgr = new DeployRecord();
app.set("deployRecordMgr", deployRecordMgr);
global.deployRecordMgr = deployRecordMgr;

// 8.4 Use specified  formatted 'result' package result
// Did "./server/deployRecordManager" need 'result'?
let result = require("./server/middlewares/result");

// Public api, anonymous access
let api = require("./server/routers/api");
app.use("/api", api, result);

// 8.5 Use params middleware check request
// Service API, use specified a valid caller, except login
let params = require("./server/middlewares/param");
app.use(params);
let serviceApi = require("./server/routers/serviceApi");
app.use("/api", serviceApi, result);

// 8.6 Use auth middleware check request
// Web API, need login
let auth = require("./server/middlewares/auth");
app.use(auth);
let privateApi = require("./server/routers/privateApi");
app.use("/api", privateApi, result);

// 8.7 Handle 404 error
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// 8.8 Handle other error.
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/***** Export app *****/
module.exports = app;
