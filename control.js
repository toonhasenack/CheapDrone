const dgram = require('dgram');

const COMMAND_TAKE_OFF = 0x01;
const COMMAND_CALIBRATE_GYRO = 0x80;
const COMMAND_UNLOCK_MOTOR = 0x40;

class Control {
  constructor(controlIp, controlPort, localhostPort) {
    this.enabled = false;
    this.sendInterval = null;
    this.socket = dgram.createSocket('udp4');
    
    this.throttle = 128;
    this.turn = 128;
    this.forwardBackward = 128;
    this.leftRight = 128;
    this.currentCommand = 0;

    this.controlIp = controlIp;
    this.controlPort = controlPort;
    this.localhostPort = localhostPort;

    // Listen for incoming commands
    this.socket.on('message', (msg, rinfo) => {
      this.handleCommand(msg);
    });

    this.socket.bind(localhostPort, 'localhost', () => {
      console.log(`Listening for commands on localhost:${this.localhostPort}`);
    });
  }

  enable() {
    this.enabled = true;
    this.sendInterval = setInterval(() => { this._sendMessage(); }, 50);
    this.calibrateGyro();
  }

  disable() {
    this.enabled = false;
    clearInterval(this.sendInterval);
    this.sendInterval = null;
  }

  _buildMessage() {
    var message = [0x66];

    if (this.currentCommand === 0) {
      message.push(this.leftRight);
      message.push(this.forwardBackward);
      message.push(this.throttle);
      message.push(this.turn);
      message.push(0);
      message.push(this.leftRight ^ this.forwardBackward ^ this.throttle ^ this.turn);
    } else {
      message.push(0x80, 0x80, 0x80, 0x80, this.currentCommand, this.currentCommand);
    }

    message.push(0x99);

    return Buffer.from(message);
  }

  _sendMessage() {
    this.socket.send(this._buildMessage(), this.controlPort, this.controlIp);
  }

  _sendCommand(cmd) {
    if (this.currentCommand === 0) {
      this.currentCommand = cmd;
      setTimeout(() => { this.currentCommand = 0; }, 500);
    }
  }

  takeOff() {
    this._sendCommand(COMMAND_TAKE_OFF);
  }

  land() {
    this._sendCommand(COMMAND_TAKE_OFF);
  }

  calibrateGyro() {
    this._sendCommand(COMMAND_CALIBRATE_GYRO);
  }

  toggleMotorLock() {
    this._sendCommand(COMMAND_UNLOCK_MOTOR);
  }

  handleCommand(msg) {
    const values = msg.toString().trim().split(' ').map(Number);
    
    if (values.length === 5) {
      const [leftRight, forwardBackward, throttle, turn, liftoff] = values;

      if (this._validateCommand(leftRight, forwardBackward, throttle, turn, liftoff)) {
        this.leftRight = leftRight;
        this.forwardBackward = forwardBackward;
        this.throttle = throttle;
        this.turn = turn;

        if (liftoff == 1) {
          this.takeOff();
        }

        else if (liftoff == 2) {
          this.land();
        }

      } else {
        console.log('Invalid command values:', values);
      }
    } else {
      console.log('Invalid message format. Expected 5 integers.');
    }
  }

  _validateCommand(leftRight, forwardBackward, throttle, turn, liftoff) {
    return (
      this._isValidValue(leftRight, 0, 254) &&
      this._isValidValue(forwardBackward, 0, 254) &&
      this._isValidValue(throttle, 0, 254) &&
      this._isValidValue(turn, 0, 254) &&
      this._isValidValue(liftoff, 0, 2)
    );
  }

  _isValidValue(value, min, max) {
    return value >= min && value <= max;
  }
}

module.exports = Control;
