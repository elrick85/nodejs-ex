/**
 * Created by zauri_000 on 06.11.2016.
 */

var Converter = require("csvtojson").Converter;
var fs = require("fs");
var stream = require("stream");

function _convert(rs, cb) {
    var result = [];
    var csvConverter = new Converter({ delimiter: ";" });

    csvConverter.on("end_parsed", function(jsonObj) {
        console.log(result);
        console.log("Finished parsing");
        cb(result);
    });

    csvConverter.on("record_parsed", function(resultRow, rawRow, rowIndex) {
        var data = {
            "word": rawRow[0],
            "trans": rawRow[1],
            "picture": rawRow[2],
            "transcription": rawRow[3],
            "example": rawRow[4],
            "audio": rawRow[5]
        };

        result.push(data);
    });

    rs.pipe(csvConverter);
}

module.exports = {
    byPath: function(csvPath, cb) {
        var rs = fs.createReadStream(csvPath);
        _convert(rs, cb);
    },

    byBuffer: function(buf, cb) {
        var bufferStream = new stream.PassThrough();
        bufferStream.end(buf);

        _convert(bufferStream, cb);
    }
};