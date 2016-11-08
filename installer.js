/**
 * Created by zauri_000 on 06.11.2016.
 */

var loki = require("lokijs");

var db = new loki('./server/db.json');
var children = db.addCollection('words', {
    unique: ['word']
});

db.saveDatabase();