var fs = require('fs');
var http = require('http');
function createHTTPserver(port){
var server = http.createServer(function(req, res) {
}).listen(process.env.PORT || port);
return server;
}


module.exports = createHTTPserver;