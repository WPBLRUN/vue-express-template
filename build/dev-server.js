// What for?
require('./check-versions')()

// Read and set environment
let config = require('../config')
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

let opn = require('opn')
let path = require('path')
let express = require('express')
let webpack = require('webpack')

// what for?
let prletoxyMiddleware = require('http-proxy-middleware')

/********************* Webpack *************************/
let webpackConfig = process.env.NODE_ENV === 'testing'
    ? require('./webpack.prod.conf')
    : require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
let port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
let autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
let proxyTable = config.dev.proxy

let app = express()
console.log('**************************')
console.log(webpackConfig)
console.log('**************************')

let compiler = webpack(webpackConfig)
/***********************************************************/
/***********    Config 是如何组织拆分的！！！  *****************/
/***********************************************************/

// how to use 'webpack-dev-middleware'
let devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: true
})
// how to use 'webpack-hot-middleware'
let hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: () => {
    },
    heartbeat: 2000
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
        hotMiddleware.publish({action: 'reload'})
        cb()
    })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
    let options = proxyTable[context]
    if (typeof options === 'string') {
        options = {target: options}
    }
    app.use(proxyMiddleware(options.filter || context, options))
})

// what for 'connect-history-api-fallback'
// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
let staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(express.static(path.join(__dirname, '..', 'public')))

/********************* Server *************************/
/// Begin - Added for server side api
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let jsen = require('jsen')
let session = require('express-session')
let MongoStore = require('connect-mongo')(session)

//now we read configuration from ENV
let serverConfig = require('../server/config/config').readCfg()
let validate = jsen(require('../server/config/config-schema.json'))
if (validate(serverConfig)) {
    app.set('config', serverConfig)
    global.config = serverConfig
} else {
    console.error('config invalid: ' + util.getValidatorError(validate))
    process.exit(-1)
}

//db
let mongoose = require('mongoose')

mongoose.Promise = require('q').Promise
let options = {}
if (serverConfig['DBUSER'] !== '' && serverConfig['DBPASSWORD'] !== '') {
    options.user = serverConfig['DBUSER']
    options.pass = serverConfig['DBPASSWORD']
}
mongoose.connect(serverConfig['MONGO'], options)
    .catch(function (err) {
        console.error('DB connection error: ' + err.message)
        process.exit(-1)
    })

/* user session */
app.use(session({
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 7 * 24 * 60 * 60
    }),
    secret: app.get('config')['SECRET']
}))

let result = require('../server/middlewares/result')

// Public api, anonymous access
let api = require('../server/routers/api')
app.use('/api', api, result)

// Service API, use specified a valid caller, except login
let params = require('../server/middlewares/param')
app.use(params)
// let serviceApi = require('../server/routers/serviceApi')
// app.use('/api', serviceApi, result)

// Web API, need login
let auth = require('../server/middlewares/auth')
app.use(auth)
// let privateApi = require('../server/routers/privateApi')
// app.use('/api', privateApi, result)
/// End - Added for server side api

let uri = 'http://localhost:' + port

// What for follow code? Who will use 'readyPromise'
let _resolve
let readyPromise = new Promise(resolve => {
    _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
    console.log('> Listening at ' + uri + '\n')
    // when env is testing, don't need open it
    if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
        opn(uri)
    }
    _resolve()
})

let server = app.listen(port)

// Why export like this?
module.exports = {
    ready: readyPromise,
    close: () => {
        server.close()
    }
}

