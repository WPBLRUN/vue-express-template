// Schema create Model, Model create Document
// Model and document could operate database, model is eraser to do this
const mongoose = require('mongoose');

// connect database
mongoose.connect('mongodb://127.0.0.1:27017');

// bind event to database connection
const db = mongoose.connection;
db.once('error',() => console.log('Mongo connection error'));
db.once('open',() => console.log('Mongo connection successed'));

/************** 定义模式loginSchema **************/
const loginSchema = mongoose.Schema({
    account : String,
    password : String
});

/************** 定义模型Model **************/
const Models = {
    Login : mongoose.model('Login',loginSchema)
}

module.exports = Models;
