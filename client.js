var fs = require('fs');
var http = require('http');
function createHTTPserver(port){
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(fs.readFileSync(__dirname + '/front/index.html', 'utf-8'));
}).listen(process.env.PORT || port);
return server;
}


module.exports = createHTTPserver;