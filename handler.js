const Control = require('./control')
const Video = require('./video')

IP = '192.168.4.153'
CONTROL_PORT = 8090
VIDEO_PORT = 8080
LOCALHOST_PORT = 8081
const control = new Control(IP, CONTROL_PORT)
const video = new Video(IP, VIDEO_PORT, LOCALHOST_PORT)

//Enable the control
control.enable()

//Start-up video feed
video.start()