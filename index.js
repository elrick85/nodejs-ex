/**
 * Created by zauri_000 on 05.11.2016.
 */

var express = require('express');
var multer = require('multer');
var path = require('path');
var bodyParser = require('body-parser');
var converter = require("./converter");
var provider = require("./provider");

var app = express();
var upload = multer();
var jsonParser = bodyParser.json()

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

app.use(express.static('dist'));

try{
    fs.accessSync(provider.getDbPath(), fs.constants.F_OK)
}
catch(e){
    provider.installDb();
}

var errorHandler = function(res, err) {
    res.status(err.status || 500);
    res.json({ message: err.message || err.error });
};

app.get('/api', function(req, res, next) {
    res.json({ message: "REST API server" });
});

app.post('/api/upload', upload.single("file"), function(req, res) {
    converter.byBuffer(req.file.buffer, function(data) {
        provider.add(data)
            .then(function(result) {
                res.json(result);
            })
            .fail(function(err) {
                errorHandler(res, err);
            });
    });
});

app.post('/api/getList', jsonParser, function(req, res) {
    provider
        .getList(req.body)
        .then(function(data) {
            res.json(data);
        })
        .fail(function(err) {
            errorHandler(res, err);
        });

});

var options = {
    root: __dirname + '/dist/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

app.get('/**', function(req, res, next) {
    res.sendFile("index.html", options);
});

app.listen(port, ip, function() {
    console.log('Express server listening on http://%s:%s', ip, port);
});

module.exports = app;