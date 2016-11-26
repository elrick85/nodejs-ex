/**
 * Created by zauri_000 on 26.11.2016.
 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var wordSchema = new Schema({
    word: String,
    meaning: String,
    trans: String,
    picture: String,
    transcription: String,
    example: String,
    audio: String,
    date: { type: Date, default: Date.now }
});

wordSchema.index({ word: 1, meaning: -1}, { unique: true });

module.exports.Word = mongoose.model('Word', wordSchema);