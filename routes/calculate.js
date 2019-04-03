var basicAuth = require('basic-auth');
var express = require('express');
var googleStocks = require('google-stocks');
var request = require('request');
var router = express.Router();
var moment = require("moment");

const numberWithCommas = (x) => {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}


const exec = require('child_process').exec;

/* GET home page. */
router.post('/', auth, function(req, res, next) {

    var yourscript = exec('python get-yahoo-quotes.py ' + req.body.stockCode + '.AX', {maxBuffer: 1024 * 500}, 
        (error, stdout, stderr) => {
            //console.log(`${stdout}`);
            // console.log(`${stderr}`);
            if (error !== null) {
                console.log(`exec error: ${error}`);
                return res.end();
            }

            var csvLines = stdout.split("\n");
           // console.log(csvLines);

            var startDate = convertDate(req.body.startDate);
            var endDate = convertDate(req.body.endDate);
            var dropPrice = req.body.dropPrice;
            var totalVolume = 0;
            var trackData = false;
            var graphData = [];
            var volumeData = [];

            for (var i = csvLines.length - 2; i >= 0; i--) {
                var dailyData = csvLines[i];
                var tokens = dailyData.split(",");
                var date = tokens[0];
                if (moment(date, "YYYY-MM-DD").valueOf() <= moment(endDate, "YYYY-MM-DD").valueOf()) {
                    trackData = true;
                }
                var closePrice = parseFloat(tokens[4]);
                var volume = parseInt(tokens[tokens.length - 1]);

                // Sometimes the start date is not a trading day
                var asxDate = moment(date, "YYYY-MM-DD").valueOf();
                var testDate = moment(startDate, "YYYY-MM-DD");
                if (asxDate < testDate) {
                    break;
                } 

                if (trackData && !isNaN(volume)) {
                    totalVolume += volume;
                    var ts = moment(date, "YYYY-MM-DD").valueOf();
                    //graphData.push([ts, dailyData.close_price - 1, dailyData.close_price]);

                    graphData.push({
                        x: ts,
                        high: closePrice,
                        low: closePrice - dropPrice,
                        name : volume
                    })
                    // console.log("GD", graphData);
                    volumeData.push([ts, volume]);
                //    console.log("VOL", dailyData.volume);
                }

                if (date.indexOf(startDate) != -1) {
                    break;
                }

            }
            //  console.log("TV", totalVolume);
            // console.log(JSON.stringify(graphData));
            graphData = graphData.reverse();
            var totalDamages = (req.body.dropPrice * totalVolume);

            totalDamages = numberWithCommas(parseInt(totalDamages));
            console.log("TOTAL DAMAGES", req.body.dropPrice * totalVolume, req.body.dropPrice, totalVolume);
            var fs = require('fs');
            fs.writeFile('myjsonfile.json', JSON.stringify(graphData), 'utf8');
            res.json({
                graphData: graphData,
                totalDamages: totalDamages
            });
        });
});

module.exports = router;

function auth(req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };

    if (user.name === 'Minters' && user.pass === 'Minters123') {
        return next();
    } else {
        return unauthorized(res);
    };
}

function convertDate(date) {
    var tokens = date.split("/");

    if (tokens[0].length == 1) {
        tokens[0] = "0" + tokens[0];
    }
    if (tokens[1].length == 1) {
        tokens[1] = "0" + tokens[1];
    }
    if (tokens[2].length == 1) {
        tokens[2] = "0" + tokens[2];
    }
    return tokens[2] + "-" + tokens[1] + "-" + tokens[0];
}