var http = require('http');
var url = require('url');
var fs = require('fs');
var readline = require('readline');


const DATAPATH = './data/data.json'; //path to the json datafile
const SLEEPTIME = 20; //time between the events in ms

// Loading of the index.html file shown to the client
var server = http.createServer(function(req, res) {
    var page = url.parse(req.url).pathname;
    if (page == '/metrics') {
        fs.readFile('./src/metrics.html', 'utf-8', function(error, content) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(content);
        });
    }
    else {
        fs.readFile('./src/index.html', 'utf-8', function(error, content) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(content);
        });
    }
});


// ******************************** Data processing ********************************
var EventEmitter = require('events').EventEmitter;
var emitTracking = new EventEmitter();

var nb_tracking_finished = 0;
var average_tracking_time = 0;
var trackings_in_progress = [];


// Process a data line
function calculate (data) {
    let detections = JSON.parse(data);
    let persons_detected = [];
    detections.forEach(detection => {
        trackingUpdate (detection);
        persons_detected.push(detection[0]);
    });

    let i = trackings_in_progress.findIndex(t => (! persons_detected.includes(t.personId)));
    while (i != -1) {
        finishedTracking (i);
        i = trackings_in_progress.findIndex(t => (! persons_detected.includes(t.personId)));
    }
}

// Process a detection
function trackingUpdate (detection) {
    let index = trackings_in_progress.findIndex(t => (t.personId == detection[0]));
    if (index == -1) { // if this is the first detection of the person, we create a new tracking record
        index = trackings_in_progress.push({
            personId:detection[0],
            trackingId:("tracking_number_" + (trackings_in_progress.length + nb_tracking_finished)),
            startLocalTimestamp:detection[1].local_timestamp,
            coordinates:detection[1].coordinates
        }) - 1;
    }
    // Update of the tracking record
    trackings_in_progress[index].endLocalTimestamp = detection[1].local_timestamp;
    trackings_in_progress[index].totalViewTime = trackings_in_progress[index].endLocalTimestamp - trackings_in_progress[index].startLocalTimestamp;
    trackings_in_progress[index].age = detection[1].rolling_expected_values.age;
    trackings_in_progress[index].gender = detection[1].rolling_expected_values.gender;
}

// when the tracking is finished
function finishedTracking (index) {
    let tracking = trackings_in_progress.splice (index, 1);
    average_tracking_time = (average_tracking_time*nb_tracking_finished + tracking[0].totalViewTime) / (nb_tracking_finished + 1);
    nb_tracking_finished ++
    // an event is emited
    emitTracking.emit ('trackingFinished', JSON.stringify(tracking[0]));
}



// ******************************** Socket and document reading ********************************
var io = require('socket.io').listen(server);


// read the data document
const rl = readline.createInterface({
    input: fs.createReadStream(DATAPATH)
});

// read a line
rl.on ('line', function(line) {
    sleep (SLEEPTIME);
    calculate(line)
});

// the socket part
io.sockets.on('connection', function (socket) {

    socket.emit('metrics', nb_tracking_finished, average_tracking_time)
    
    // a tracking record is finished
    emitTracking.on('trackingFinished', function(tracking) {
        socket.emit('newCalcul', tracking);
        socket.emit('metrics', nb_tracking_finished, average_tracking_time)
    })
    
});

// ******************************** Utils ********************************

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }





server.listen(8080);

