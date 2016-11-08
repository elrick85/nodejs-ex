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

app.use(express.static('../dist'));

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

app.listen(3000, function() {
    console.log('Express server listening on port 3000');
});