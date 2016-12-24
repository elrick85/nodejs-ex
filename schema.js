/**
 * Created by zauri_000 on 26.11.2016.
 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var meaningSchema = new Schema({
    meaning: {type: String, default: ""},
    trans: {type: String, default: ""},
    picture: {type: String, default: ""},
    example: {type: String, default: ""},
    date: { type: Date, default: Date.now }
});

var wordSchema = new Schema({
    word: String,
    meanings: [meaningSchema],
    transcription: {type: String, default: ""},
    audio: {type: String, default: ""},
    date: { type: Date, default: Date.now }
});

wordSchema.index({ word: 1 }, { unique: true });

module.exports.Word = mongoose.model('Word', wordSchema);

module.exports.Meaning = mongoose.model('Meaning', meaningSchema);