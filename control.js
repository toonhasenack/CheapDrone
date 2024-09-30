const dgram = require('dgram')

const COMMAND_TAKE_OFF = 0x01
const COMMAND_CALIBRATE_GYRO = 0x80
const COMMAND_UNLOCK_MOTOR = 0x40

class Control {
  constructor(controlIp, controlPort, localhostPort) {
    this.enabled = false
    this.sendInterval = null
    this.sendSocket = new dgram.createSocket("udp4")
    this.listenSocket = new dgram.createSocket("udp4")
    
    this.throttle = 128
    this.turn = 128
    this.forwardBackward = 128
    this.leftRight = 128
    this.currentCommand = 0

    this.controlIp = controlIp
    this.controlPort = controlPort
    this.localhostPort = localhostPort

    // Listen for incoming commands
    this.listenSocket.on('message', (msg, rinfo) => {
      this.handleCommand(msg)
    })

    this.listenSocket.bind(localhostPort, 'localhost', () => {
      console.log(`Listening for commands on http://localhost:${this.localhostPort}`)
    })
  }

  enable() {
    this.enabled = true
    this.sendInterval = setInterval(() => { this._sendMessage() }, 50)
  }

  disable() {
    this.enabled = false
    clearInterval(this.sendInterval)
    this.sendInterval = null
  }

  _buildMessage() {
    var message = [0x66]

    if (this.currentCommand === 0) {
      message.push(this.leftRight)
      message.push(this.forwardBackward)
      message.push(this.throttle)
      message.push(this.turn)
      message.push(0)
      message.push(this.leftRight ^ this.forwardBackward ^ this.throttle ^ this.turn)
    } else {
      message.push(0x80)
      message.push(0x80)
      message.push(0x80)
      message.push(0x80)
      message.push(this.currentCommand)
      message.push(this.currentCommand)
    }

    message.push(0x99)

    return Buffer.from(message)
  }

  _sendMessage() {
    this.sendSocket.send(this._buildMessage(), this.controlPort, this.controlIp)
  }

  _sendCommand(cmd) {
    if (this.currentCommand === 0) {
      this.currentCommand = cmd
      setTimeout(() => { this.currentCommand = 0 }, 500)
    }
  }

  takeOff() {
    this._sendCommand(COMMAND_TAKE_OFF)
  }

  land() {
    this._sendCommand(COMMAND_TAKE_OFF)
  }

  calibrateGyro() {
    this._sendCommand(COMMAND_CALIBRATE_GYRO)
  }

  toggleMotorLock() {
    this._sendCommand(COMMAND_UNLOCK_MOTOR)
  }

  handleCommand(msg) {
    if (msg.length === 5) {
      // Directly access each byte in the Buffer
      this.leftRight = msg[0]        // First byte
      this.forwardBackward = msg[1]   // Second byte
      this.throttle = msg[2]          // Third byte
      this.turn = msg[3]              // Fourth byte
      this.command = msg[4]  
        
      if (this.command == 0){
      }

      else if (this.command == 1) {
        this.takeOff()
      }

      else if (this.command == 2) {
        this.land()
      }

      else if (this.command == 3) {
        this.calibrateGyro()
      }

      console.log('Values:', [this.leftRight, this.forwardBackward, this.throttle, this.turn, this.command])

    } else {
      console.log('Invalid input')
    }
  }

  _validateCommand(leftRight, forwardBackward, throttle, turn, liftoff) {
    return (
      this._isValidValue(leftRight, 0, 255) &&
      this._isValidValue(forwardBackward, 0, 255) &&
      this._isValidValue(throttle, 0, 255) &&
      this._isValidValue(turn, 0, 255) &&
      this._isValidValue(liftoff, 0, 2)
    )
  }

  _isValidValue(value, min, max) {
    return value >= min && value <= max
  }
}

module.exports = Control
