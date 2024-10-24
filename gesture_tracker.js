class GestureTracker {
  constructor() {
    this.gestures = {
    thinking: {
        duration: 1500, // 2 seconds
        lastHandPosition: null,
        startTime: null,
        isActive: false
    },
    silence : {
      duration: 1200,
      lastHandPosition: null,
      startTime: null,
      isActive: false
    }
      };
      this.faceData = null;
      this.activeGestures = [];
    }

    calculate_distance (point1, point2) {
      return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + 
        Math.pow(point1.y - point2.y, 2)
      );
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
      const distance = this.calculate_distance(chin, hand);
      
      return distance < 0.10; // Threshold for "near chin"
  }

  isFingerOnLips(handLandmark) {
    if (!this.faceData) return false;
    const upperLip = this.faceData[13];  // Upper lip center
    const lowerLip = this.faceData[14];  // Lower lip center
    const indexFingerTip = handLandmark[8];  // Index finger tip

    const lipsMidpoint = {
      x: (upperLip.x + lowerLip.x) / 2,
      y: (upperLip.y + lowerLip.y) / 2
    };

    const distance = this.calculate_distance(lipsMidpoint, indexFingerTip);
    return distance < 0.05;  // Tighter threshold for lips
  }

  drawGestureText(ctx) {
    if (this.activeGestures.length === 0) return;
    
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.font = '32px Arial';
    
    this.activeGestures.forEach((gesture, index) => {
      const text = `Detected: ${gesture}`;
      ctx.strokeText(text, 10, 30 + (index * 30));
      ctx.fillText(text, 10, 30 + (index * 30));
    });
    
    ctx.restore();
  }
  

  trackThinkingGesture(handLandmarks, currentTime) {
      const gesture = this.gestures.thinking;
      
      if (!handLandmarks || handLandmarks.length === 0) {
      gesture.isActive = false;
      gesture.startTime = null;
      this.activeGestures = this.activeGestures.filter(g => g !== 'Thinking');
      return false;
      }

      const isNearChin = this.isHandNearChin(handLandmarks[0]);

      if (isNearChin) {
      if (!gesture.startTime) {
          gesture.startTime = currentTime;
      }
      
      if (currentTime - gesture.startTime >= gesture.duration) {
          gesture.isActive = true;
          if (!this.activeGestures.includes('Thinking')) {
            this.activeGestures.push('Thinking');
          }
          return true;
      }
      } else {
      gesture.startTime = null;
      gesture.isActive = false;
      this.activeGestures = this.activeGestures.filter(g => g !== 'Thinking');
      }

      return false;
  }

  trackSilenceGesture(handLandmarks, currentTime) {
    const gesture = this.gestures.silence;
    
    if (!handLandmarks?.length) {
      gesture.isActive = false;
      gesture.startTime = null;
      this.activeGestures = this.activeGestures.filter(g => g !== 'Silence');
      return false;
    }

    const isOnLips = this.isFingerOnLips(handLandmarks[0]);

    if (isOnLips) {
      if (!gesture.startTime) {
        gesture.startTime = currentTime;
      }
      
      if (currentTime - gesture.startTime >= gesture.duration) {
        gesture.isActive = true;
        if (!this.activeGestures.includes('Silence')) {
          this.activeGestures.push('Silence');
        }
        return true;
      }
    } else {
      gesture.startTime = null;
      gesture.isActive = false;
      this.activeGestures = this.activeGestures.filter(g => g !== 'Silence');
    }

    return false;
  }

  trackThumbsUpGesture(gestureResults) {
    if (!gestureResults?.gestures?.length) {
      this.activeGestures = this.activeGestures.filter(g => g !== 'Thumbs Up');
      return;
    }

    for (const handGestures of gestureResults.gestures) {
      for (const gesture of handGestures) {
        if (gesture.categoryName === 'Thumb_Up' && gesture.score > 0.60) {
          if (!this.activeGestures.includes('Thumbs Up')) {
            this.activeGestures.push('Thumbs Up');
          }
          return;
        }
      }
    }

    this.activeGestures = this.activeGestures.filter(g => g !== 'Thumbs Up');
  }

}

export default GestureTracker;