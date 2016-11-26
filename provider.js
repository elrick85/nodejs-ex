/**
 * Created by zauri_000 on 06.11.2016.
 */

var loki = require("lokijs");
var Q = require("q");
var path = require("path");
var mongoose = require('mongoose');

var mongoURL = process.env.MONGODB_DB_URL;

var Word = require("./schema").Word;

module.exports = {
    connection: function(cb) {
        return this.connect()
            .then(cb)
            .catch(function(err) {
                mongoose.connection.close();
                return Q.reject(err);
            })
            .then(function(data) {
                mongoose.connection.close();
                return data;
            });
    },

    connect: function() {
        var self = this;

        mongoose.connect(mongoURL);

        var db = mongoose.connection;
        var defer = Q.defer();

        db.on('error', function(err) {
            defer.reject(err);
        });

        db.once('open', function() {
            defer.resolve(db);
        });

        return defer.promise;
    },

    getTotal: function(options) {
        var self = this;

        return self.connection(function() {
            return self._getTotal(options);
        });
    },

    _getTotal: function(options) {
        var defer = Q.defer();
        var find = Word.where(options);

        find.count(function(err, count) {
            if(err) {
                defer.reject(err);
            } else {
                defer.resolve(count)
            }
        });

        return defer.promise;
    },

    _getList: function(_options) {
        var defer = Q.defer();

        Word.where({})
            .skip(_options.offset)
            .limit(_options.limit)
            .exec(function(err, data) {
                if(err) {
                    defer.reject(err);
                } else {
                    var info = {
                        data: data,
                        pagination: {}
                    };

                    defer.resolve(info);
                }
            });

        return defer.promise;
    },

    getList: function(options) {
        var _options = {
            offset: options.offset ? Number(options.offset) : 0,
            limit: options.limit ? Number(options.limit) : 1
        };

        var self = this;

        return self.connection(function() {
            var _all = [self._getTotal({}), self._getList(_options)];

            return Q.spread(_all, function(total, list) {
                list.pagination = {
                    total: total,
                    offset: _options.offset,
                    limit: _options.limit
                };

                return list;
            });
        });
    },

    _findOneAndUpdate: function(data) {
        var defer = Q.defer();

        Word.findOneAndUpdate({"_id": data._id}, { $set: data })
            .exec(function(err, row) {
                if(err) {
                    defer.reject(err);
                } else {
                    defer.resolve(row);
                }
            });

        return defer.promise;
    },

    update: function(data) {
        var self = this;

        var process = function() {
            return self._findOne({"_id": data._id})
                .then(function(item) {
                    if(item.word === data.word){
                        return self._findOneAndUpdate(data);
                    } else {
                        return Q.reject(new Error("You can not change a word title!"));
                    }
                });
        };

        return this.connection(process);
    },

    _findOne: function(options) {
        var defer = Q.defer();

        Word.findOne(options)
            .exec(function(e, data) {
                if(e) {
                    defer.reject(e);
                } else {
                    defer.resolve(data);
                }
            });

        return defer.promise;
    },

    findOne: function(options) {
        var self = this;

        var process = function() {
            return self._findOne(options);
        };

        return this.connection(process);
    },

    _saveItem: function(item) {
        var defer = Q.defer();
        var row = new Word(item);

        row.save(function(e) {
            if(e) {
                defer.reject(e);
            } else {
                defer.resolve(true);
            }
        });

        return defer.promise;
    },

    addOne: function(data) {
        var self = this;

        var process = function() {
            return self._saveItem(data);
        };

        return this.connection(process);
    },

    addMany: function(data) {
        var self = this;

        var process = function() {
            if(data.length) {

                var arrPromises = data.reduce(function(res, v) {
                    var promise = self._saveItem(v);

                    res.push(promise);

                    return res;
                }, []);
            }

            return Q.allSettled(arrPromises)
                .then(function(res) {
                    var errors = [];

                    res.forEach(function(result) {
                        if(result.state !== "fulfilled") {
                            errors.push(result.reason);
                        }
                    });

                    return {
                        success: (res.length - errors.length),
                        errors: errors
                    }
                });
        };

        return this.connection(process);
    }
};