/**
 * Created by zauri_000 on 06.11.2016.
 */

var loki = require("lokijs");
var Q = require("q");
var path = require("path");

module.exports = {
  getDbPath: function() {
    return path.join(__dirname, 'db.json');
  },
  getList: function(options) {

    var _options = {
      offset: options.offset ? Number(options.offset) : 0,
      limit: options.limit ? Number(options.limit) : 1
    };

    var defer = Q.defer();
    var dbPath = this.getDbPath();
    var db = new loki(dbPath);

    db.loadDatabase({}, function(res) {
      var col = db.getCollection("words");
      var resultset = col.chain().find({}).branch();
      var total = resultset.count();

      var data = resultset
        .offset(_options.offset)
        .limit(_options.limit)
        .data();

      defer.resolve({
        data: data,
        pagination: {
          offset: _options.offset,
          limit: _options.limit,
          total: total
        }
      });
    });

    return defer.promise;
  },

  add: function(data) {
    var defer = Q.defer();
    var dbPath = this.getDbPath();
    var db = new loki(dbPath);
    var errors = [];

    db.loadDatabase({}, function(res) {
      var col = db.getCollection("words");
      if(data.length) {
        data.forEach(function(v) {
          try {
            col.insert(v);
          }
          catch(e) {
            errors.push({ message: e.message });
          }
        });

        db.saveDatabase();
      }

      var sCount = data.length - errors.length;

      defer.resolve({
        success: sCount,
        errors: errors
      });
    });

    return defer.promise;
  }
};