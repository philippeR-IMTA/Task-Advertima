var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./src/index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

var lll = 1;
// Fonction calculer
function next () {
    lll++;
    return lll;
}


// Chargement de socket.io
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    
    socket.emit('newCalcul', 1);

    // simulation des calculs
    socket.on('done', function () {
        io.sockets.emit('newCalcul', next());
    })
    
});




server.listen(8080);

