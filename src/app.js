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


// **************** Calculations ****************
var nb_tracking_finished = 0;
var average_tracking_time = 0;
var trackings_in_progress = [];


// Processing a detection
function calculate (data) {
    let detection = JSON.parse(data);
    let persons_detected = [];
    detection.forEach(element => {
        trackingUpdate (element);
        persons_detected.push(element[0]);
    });

    let i = trackings_in_progress.findIndex(t => (! persons_detected.includes(t.personId)));
    while (i != -1) {
        finishedTracking (i);
        i = trackings_in_progress.findIndex(t => (! persons_detected.includes(t.personId)));
    }

    return data;
}

// Processing a detection of a person
function trackingUpdate (element) {
    let index = trackings_in_progress.findIndex(t => (t.personId == element[0]));
    if (index == -1) { // if this is the first detection of the person, we create a new tracking record
        index = trackings_in_progress.push({
            personId:element[0],
            trackingId:("tracking_number_" + (trackings_in_progress.length + nb_tracking_finished)),
            startLocalTimestamp:element[1].local_timestamp,
            coordinates:element[1].coordinates
        }) - 1;
    }
    // Update of the tracking record
    trackings_in_progress[index].endLocalTimestamp = element[1].local_timestamp;
    trackings_in_progress[index].totalViewTime = trackings_in_progress[index].endLocalTimestamp - trackings_in_progress[index].startLocalTimestamp;
    trackings_in_progress[index].age = element[1].rolling_expected_values.age;
    trackings_in_progress[index].gender = element[1].rolling_expected_values.gender;
}

// the tracking at the specified index is finished
function finishedTracking (index) {
    let tracking = trackings_in_progress.splice (index, 1);
    average_tracking_time = (average_tracking_time*nb_tracking_finished + tracking[0].totalViewTime) / (nb_tracking_finished + 1);
    nb_tracking_finished ++
}



// **************** Socket ****************
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

