# Advertima task

The goal of this project is to analyse detections from a camera and produce tracking records with them

## Getting started

### Prerequisite

Node.js

### How to run the application ?

Go into the headfile 'task Advertima' and run the following command :

'''
node src/app.js
'''

then the server will run on http://localhost:8080


## My approach

To simulate the time between two detections, I decided to read the json document line by line with a constant time between the event. This constant ca be edited at the start of the app.js document.

The file is read by the server and an event is emited when a tracking record is finished. This is at this time that I choose to implement the counter of total tracking and send it to the /metrics page to actualise it. Thus the /metrics page is also updated by a websocket.

Concerning the tracking records composition, I choose the 'coordinates' object to be the first coordinates where the person was detected. I also had to choose the trackingId value so I choose to name it 'tracking_number_' plus a number corresponding of the appearance of the tracking record since the server started.

In the html home page, I choose to display the incoming tracking records as their json equivalent directly as a text. Each new record is added as a new line at the end of the text.