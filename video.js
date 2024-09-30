const express = require('express');
const dgram = require('dgram');

class Video {
    constructor(videoIp, videoPort, localhostPort) {
        this.videoPort = videoPort; // Port for UDP communication
        this.localhostPort = localhostPort; // Port for localhost output
        this.videoIp = videoIp; // Drone IP address
        this.videoData = []; // Video data buffer

        // Initialize Express app and UDP socket
        this.app = express();
        this.udpSocket = dgram.createSocket('udp4');

        // Setup routes and UDP listeners
        this._setupRoutes();
        this._setupUdpSocket();
    }

    // Initialize the server
    enable() {
        this.udpSocket.bind(this.videoPort, () => {
            console.log(`Listening for UDP messages on ${this.videoIp}:${this.videoPort}`);
            this._sendInitHexMessages();
        });

        // Start the Express server
        this.app.listen(this.localhostPort, () => {
            console.log(`Express server is running at http://localhost:${this.localhostPort}/video`);
        });
    }

    // Setup Express routes
    _setupRoutes() {
        this.app.get('/video', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Transfer-Encoding': 'chunked'
            });

            // Send the collected video data as it arrives
            const sendData = () => {
                while (this.videoData.length > 0) {
                    const chunk = this.videoData.shift();
                    res.write(chunk); // Write the chunk to the response
                }
            };

            // Set an interval to send data to the response
            const interval = setInterval(() => {
                sendData();
            }, 100); // Adjust interval as needed

            // Handle cleanup on response end
            res.on('close', () => {
                clearInterval(interval);
                res.end();
            });
        });
    }

    // Setup UDP socket to listen for incoming messages
    _setupUdpSocket() {
        this.udpSocket.on('message', (msg, rinfo) => {
            this.videoData.push(msg); // Store received video data
        });
    }

    // Function to send initialization hex messages to the drone
    _sendInitHexMessages() {
        const initHexData = Buffer.from([0x42, 0x76]); // Replace with your init data
        for (let i = 0; i < 5; i++) { // Send it a few times
            this.udpSocket.send(initHexData, 0, initHexData.length, this.videoPort, this.videoIp, (err) => {
                if (err) {
                    console.error('Error sending init data:', err);
                }
            });
        }
    }

    // Graceful shutdown method to clean up when exiting
    shutdown() {
        console.log('Received shutdown signal. Sending termination hex messages...');
        const exitHexData = Buffer.from([0x42, 0x77]); // Hex data for termination

        // Send the exit messages a few times
        for (let i = 0; i < 5; i++) {
            this.udpSocket.send(exitHexData, 0, exitHexData.length, this.videoPort, this.videoIp, (err) => {
                if (err) {
                    console.error('Error sending exit data:', err);
                }
            });
        }

        // Clean up and exit after a short delay
        setTimeout(() => {
            this.udpSocket.close();
            console.log('Server shutting down...');
            process.exit();
        }, 1000); // Wait a moment before closing
    }
}

// Handle process termination signals for graceful shutdown
process.on('SIGINT', () => { videoStreamServer.shutdown(); });
process.on('SIGTERM', () => { videoStreamServer.shutdown(); });

module.exports = Video;