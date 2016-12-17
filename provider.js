/**
 * Created by zauri_000 on 06.11.2016.
 */

var loki = require("lokijs");
var Q = require("q");
var path = require("path");
var mongoose = require('mongoose');

var mongoURL = process.env.MONGODB_DB_URL;

var Word = require("./schema").Word;
var Meaning = require("./schema").Meaning;

module.exports = {
    connection: function(cb) {
        return this.connect()
            .then(cb)
            .then(function(data) {
                mongoose.connection.close();
                return data;
            })
            .catch(function(err) {
                mongoose.connection.close();
                return Q.reject(err);
            });
    },

    connect: function() {
        var self = this;

        var defer = Q.defer();

        mongoose.connection.close()
            .then(function() {
                mongoose.connect(mongoURL);

                var db = mongoose.connection;

                db.once('error', function(err) {
                    defer.reject(err);
                });

                db.once('open', function() {
                    defer.resolve(db);
                });
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

        var pipeline = [
            { $unwind: "$meanings" },
            {
                $group: {
                    _id: {
                        _id: "$_id",
                        word: "$word",
                        transcription: "$transcription",
                        audio: "$audio",
                        date: "$date"
                    },
                    meaningsCount: { $sum: 1 }
                }
            }
        ];

        if(_options.sort){
            pipeline.push({ $sort: _options.sort });
        }

        pipeline.push({ $skip: _options.skip });
        pipeline.push({ $limit: _options.take });

        Word
            .aggregate(pipeline)
            .exec(function(err, data) {
                if(err) {
                    defer.reject(err);
                } else {
                    var ids = data.map(function(v) {
                        return v._id;
                    });

                    Word
                        .where({_id: {"$in": ids}})
                        .exec(function(err, items) {
                            if(err){
                                defer.reject(err);
                            } else {
                                var _items = data.map(function(v) {
                                    var _id = v._id._id.toString();

                                    var item = items.find(function(c) {
                                        return c._id.toString() === _id;
                                    });

                                    if(item){
                                        item = item.toJSON();
                                        item.meaningsCount = v.meaningsCount;
                                        return item;
                                    } else {
                                        return v;
                                    }
                                });

                                var info = {
                                    data: _items,
                                    pagination: {}
                                };

                                defer.resolve(info);
                            }
                        });
                }
            });

        return defer.promise;
    },

    _getMeaningsTotal: function(options) {
        var defer = Q.defer();
        var find = Meaning.where(options);

        find.count(function(err, count) {
            if(err) {
                defer.reject(err);
            } else {
                defer.resolve(count)
            }
        });

        return defer.promise;
    },

    _getMeaningsList: function(_options) {
        var defer = Q.defer();

        Meaning.where({})
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
        var self = this;

        if(options.sort){
            var _sort = options.sort.reduce(function(res, v) {
                var order = v.dir === "desc" ? -1 : 1;
                if(v.field !== "meaningsCount"){
                    res["_id." + v.field] = order;
                } else {
                    res[v.field] = order;
                }

                return res;
            }, {});

            options.sort = _sort;
        }

        return self.connection(function() {
            var _all = [self._getTotal({}), self._getList(options)];

            return Q.spread(_all, function(total, list) {
                list.pagination = {
                    total: total
                };

                return list;
            });
        });
    },

    getMeaningList: function(options) {
        var _options = {
            offset: options.offset ? Number(options.offset) : 0,
            limit: options.limit ? Number(options.limit) : 1
        };

        var self = this;

        return self.connection(function() {
            var _all = [self._getMeaningsTotal({}), self._getMeaningsList(_options)];

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

        Word.findOneAndUpdate({ "_id": data._id }, { $set: data })
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
            return self._findOne({ "_id": data._id })
                .then(function(item) {
                    if(item.word === data.word) {
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

    _saveWordItem: function(item) {
        var defer = Q.defer();
        var _meaning = new Meaning(item);
        var _word = new Word(item);

        _word.meanings = [_meaning];

        _word.save(function(e, data) {
            if(e) {
                defer.reject(e);
            } else {
                defer.resolve(data);
            }
        });

        return defer.promise;
    },

    _saveItem: function(item) {
        var self = this;

        return self._saveWordItem(item);
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