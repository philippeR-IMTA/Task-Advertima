var http = require('http');
var fs = require('fs');
var readline = require('readline');

// the path to the data file
var dataPath = './data/data.json';

// Loading of the index.html file shown to the client
var server = http.createServer(function(req, res) {
    fs.readFile('./src/index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// The calculation we do with the data
function calculate (data) {
    return data;
}


// Chargement de socket.io
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

    // we read the data document
    let rl = readline.createInterface({
        input: fs.createReadStream(dataPath)
    });
    
    // we read a line and do calculations on it
    rl.on ('line', function(line) {
        rl.pause();
        io.sockets.emit('newCalcul', calculate(line));
    });

    // when the tracking record is shown on screen, we start to analyse the next line
    socket.on('done', function () {
        rl.resume();
    })
    
});


server.listen(8080);

