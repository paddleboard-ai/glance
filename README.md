# Glance

A lightweight JavaScript framework for real-time face and gesture detection in web browsers using MediaPipe. This framework makes it easy to implement and track custom gestures using webcam input.

## Features

- Real-time face detection and mesh rendering
- Hand gesture recognition
- Built-in gesture detection:
  - Thinking (hand on chin)
  - Silence (finger on lips)
  - Mind Blown (hands expanding from temples)
  - Thumbs Up
- Extensible gesture system
- Webcam integration
- GPU-accelerated processing
- Colored face mesh visualization

## Quick Start

1. Clone this repository:
   ```bash
   git clone git@github.com:paddleboard-ai/glance.git
   cd glance
   ```

2. Start a local web server:
   ```bash
   python3 -m http.server
   # or use any other local server of your choice
   ```

3. Open `http://127.0.0.1:8000/face.html` in your browser and allow webcam access

## Project Structure

```
├── gestures/
│   ├── mind_blown.js
│   ├── silence.js
│   ├── thinking.js
│   └── thumbs_up.js
├── face.html
├── script.js
├── gesture_tracker.js
└── utils.js
```

### Core Files
- `face.html`: Main entry point and UI
- `script.js`: Core detection and rendering logic
- `gesture_tracker.js`: Gesture management and coordination
- `utils.js`: Common utility functions

### Gesture System
Each gesture is implemented as a separate class in the `gestures/` directory. All gestures follow a common pattern:

1. Class-based implementation
2. Constructor for initialization
3. Tracking method that returns boolean (gesture detected or not)
4. Utility methods specific to the gesture

## Adding New Gestures

1. Create a new file in the `gestures/` directory:
   ```javascript
   // gestures/my_gesture.js
   import { Utils } from '../utils.js';

   class MyGesture {
     constructor() {
       this.utils = new Utils();
       this.isActive = false;
       this.startTime = null;
     }

     trackMyGesture(handLandmarks, faceData, currentTime) {
       // Implement gesture detection logic
       return false; // or true when detected
     }
   }

   export { MyGesture };
   ```

2. Add the gesture to `gesture_tracker.js`:
   ```javascript
   import { MyGesture } from './gestures/my_gesture.js';

   // Add to GESTURE_NAMES
   const GESTURE_NAMES = Object.freeze({
     // ... existing gestures ...
     MY_GESTURE: 'My Gesture'
   });

   class GestureTracker {
     constructor() {
       // ... existing initialization ...
       this.myGesture = new MyGesture();
     }

     // Add tracking method
     trackMyGesture(handLandmarks, currentTime) {
       if (this.myGesture.trackMyGesture(handLandmarks, this.faceData, currentTime)) {
         if (!this.activeGestures.includes(GESTURE_NAMES.MY_GESTURE)) {
           this.activeGestures.push(GESTURE_NAMES.MY_GESTURE);
         }
         return;
       } else {
         this.activeGestures = this.activeGestures.filter(g => g !== GESTURE_NAMES.MY_GESTURE);
       }
     }
   }
   ```

3. Update the detection loop in `script.js` to call your new gesture tracker.

## MediaPipe Integration

The framework uses MediaPipe's Vision tasks for:
- Face landmark detection (468 points)
- Hand landmark detection (21 points per hand)
- Gesture recognition

Models are loaded from MediaPipe's CDN, and ran in a WASM container.

## Performance Considerations

- Uses GPU delegation when available
- Implements cooldown periods for complex gestures
- Frame-by-frame processing with requestAnimationFrame

## Browser Compatibility

- Requires WebGL support
- Needs webcam access
- Tested on modern versions of Chrome, Brave, and Edge
- Mobile browser support may vary

## Contributing

Contributions are welcome! Areas for improvement include:
- Additional gestures
- Performance optimizations
- Mobile browser support
- UI improvements
- Documentation

## License

[Apache 2](https://choosealicense.com/licenses/apache-2.0/)