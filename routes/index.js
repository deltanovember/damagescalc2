var basicAuth = require('basic-auth');
var express = require('express');
var request = require("request");
var router = express.Router();

/* GET home page. */
router.get('/', auth, function(req, res, next) {
    
    var url = "http://www.asx.com.au/asx/research/ASXListedCompanies.csv";
    var companies = [];
    request.get(url, (error, response, body) => {

        var tokens = body.split("\n");
        for (var i=0; i < tokens.length; i++) {
            var splitLine = tokens[i].split(",");
            if (splitLine.length > 1) {
                var name = splitLine[0].replace(/\"/g, '').replace("'","");
                var code = splitLine[1].replace(/\"/g, '').replace("'","");
                console.log(name);
                console.log(code);
                if (name != "Company name")
                    companies.push(code + " (" + name + ")");
            }
        }
        res.render('index', {
        title: 'Express', companies: JSON.stringify(companies)
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