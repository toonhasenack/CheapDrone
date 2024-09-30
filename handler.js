const Control = require('./control')
const Video = require('./video')

IP = '192.168.4.153'
CONTROL_PORT = 8090
CONTROL_IN_PORT = 8091
VIDEO_PORT = 8080
VIDEO_OUT_PORT = 8081

const control = new Control(IP, CONTROL_PORT, CONTROL_IN_PORT)
const video = new Video(IP, VIDEO_PORT, VIDEO_OUT_PORT)

//Enable the control
control.enable()

//Enable the video feed
video.enable()