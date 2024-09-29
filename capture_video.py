import cv2

PORT = 8081
STREAM_URL = f"http://localhost:{PORT}/video"

# Create a VideoCapture object
cap = cv2.VideoCapture(STREAM_URL)

# Check if the stream opened successfully
if not cap.isOpened():
    print("Error: Could not open video stream.")
    exit()

# Set the resolution and frame rate (based on FFmpeg stream info)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)    # Set width to 640 pixels
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)   # Set height to 480 pixels
cap.set(cv2.CAP_PROP_FPS, 25)             # Set frame rate to 25 FPS

while True:
    # Capture frame-by-frame
    ret, frame = cap.read()

    if not ret:
        print("Error: No frame received.")
        break

    # Display the resulting frame
    cv2.imshow('Video Stream', frame)

    # Exit loop on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the capture and close windows
cap.release()
cv2.destroyAllWindows()
