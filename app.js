var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const port = process.env.PORT || "8000";
const mongoose = require("mongoose");
var app = express();
var usersRouter = require('./routes/api');
var usersRouter2 = require('./routes/proxies');
var http = require('http');

//var db ="mongodb://127.0.0.1:27017/sockserver";
var db ="mongodb://localhost:27017/sockserver";
mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection; 
connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     next(createError(404));
//   });
 app.use(logger('dev'));
 app.use(express.json());
app.use(express.urlencoded({ extended: false }));
 app.use(cookieParser());
 app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/proxy', usersRouter);
app.use('/proxies', usersRouter2);

app.get('/view', function(req, res) {
    res.render('index2');
});
app.listen(port, async () => {
    //const proxies = await Proxy.find({});
   // await proxiesRouter.loadProxies(proxies);
    
    console.log(`Listening to requests on http://localhost:${port}`);

});
function request(){
    http.get('http://localhost:8000/proxies/reloadcustom?type=custom', function(response) {
    console.log('Status:', response.statusCode);
    console.log('Headers: ', response.headers);
    response.pipe(process.stdout);
});
}
// cron.schedule("*/1 * * * *",function(){
//     //request();
//   })