class GestureTracker {
  constructor() {
    this.gestures = {
    thinking: {
        duration: 1500, // 2 seconds
        lastHandPosition: null,
        startTime: null,
        isActive: false
      }
      };
      this.faceData = null;
    }

  updateFaceData(faceLandmarks) {
      if (faceLandmarks && faceLandmarks.length > 0) {
      this.faceData = faceLandmarks[0];
      }
  }

  isHandNearChin(handLandmark) {
      if (!this.faceData) return false;
      
      // Get chin position (point 152 in MediaPipe face landmarks)
      const chin = this.faceData[152];
      const hand = handLandmark[8]; // Using palm base point
      
      // Calculate distance between hand and chin
      const distance = Math.sqrt(
      Math.pow(chin.x - hand.x, 2) + 
      Math.pow(chin.y - hand.y, 2)
      );
      
      return distance < 0.10; // Threshold for "near chin"
  }

  trackThinkingGesture(handLandmarks, currentTime) {
      const gesture = this.gestures.thinking;
      
      if (!handLandmarks || handLandmarks.length === 0) {
      gesture.isActive = false;
      gesture.startTime = null;
      return false;
      }

      const isNearChin = this.isHandNearChin(handLandmarks[0]);

      if (isNearChin) {
      if (!gesture.startTime) {
          gesture.startTime = currentTime;
      }
      
      if (currentTime - gesture.startTime >= gesture.duration) {
          gesture.isActive = true;
          return true;
      }
      } else {
      gesture.startTime = null;
      gesture.isActive = false;
      }

      return false;
    }
}

export default GestureTracker;