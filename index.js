/**
 * Created by zauri_000 on 05.11.2016.
 */

var express = require('express');
var multer = require('multer');
var path = require('path');
var bodyParser = require('body-parser');
var converter = require("./converter");
var provider = require("./provider");
var fs = require("fs");

var app = express();
var upload = multer();
var jsonParser = bodyParser.json();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

app.use(express.static('dist'));

var errorHandler = function(res, err) {
    res.status(err.status || 500);
    res.json({ message: err.message || err.error });
};

app.get('/api', function(req, res, next) {
    res.json({ message: "REST API server" });
});

app.post('/api/upload', upload.single("file"), function(req, res) {
    converter.byBuffer(req.file.buffer, function(data) {
        provider
            .addMany(data)
            .then(function(result) {
                res.json(result);
            })
            .fail(function(err) {
                errorHandler(res, err);
            });
    });
});

app.post('/api/word', jsonParser, function(req, res) {
    provider
        .findOne(req.body)
        .then(function(data) {
            res.json(data);
        })
        .fail(function(err) {
            errorHandler(res, err);
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

app.post("/api/update", jsonParser, function(req, res) {
    provider
        .update(req.body)
        .then(function(data) {
            res.json(data);
        })
        .fail(function(err) {
            errorHandler(res, err);
        });
});

app.post("/api/add", jsonParser, function(req, res) {
    provider
        .addOne(req.body)
        .then(function(data) {
            res.json(data);
        })
        .fail(function(err) {
            errorHandler(res, err);
        });
});

app.listen(port, ip, function() {
    console.log('Express server listening on http://%s:%s', ip, port);
});

module.exports = app;