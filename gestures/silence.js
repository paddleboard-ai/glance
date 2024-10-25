import { Utils } from '../utils.js';

class SilenceGesture {
    constructor() {
        this.utils = new Utils();
        this.isActive = false;
        this.startTime = null;

    }
    
    isFingerOnLips(handLandmark, faceData) {
        if (!faceData) return false;
        const upperLip = faceData[13];
        const lowerLip = faceData[14];
        const indexFingerTip = handLandmark[8];
    
        const lipsMidpoint = {
          x: (upperLip.x + lowerLip.x) / 2,
          y: (upperLip.y + lowerLip.y) / 2
        };
    
        const distance = this.utils.calculate_distance(lipsMidpoint, indexFingerTip);
        return distance < 0.05;
    }

    trackSilenceGesture(handLandmarks, faceData, currentTime) {
        const DURATION = 1200;
        if (!handLandmarks?.length || !faceData) {
          this.isActive = false;
          this.startTime = null;
          return false;
        }
    
        const isOnLips = this.isFingerOnLips(handLandmarks[0], faceData);
    
        if (isOnLips) {
          if (!this.startTime) {
            this.startTime = currentTime;
          }
          
          if (currentTime - this.startTime >= DURATION) {
            this.isActive = true;
            return true;
          }
        } else {
          this.startTime = null;
          this.isActive = false;
        }
    
        return false;
      }
}

export { SilenceGesture };