import { Utils } from '../utils.js';

class ThinkingGesture {

  constructor(){
    this.startTime = null;
    this.isActive = false;
    this.utils = new Utils();
  }

  isHandNearChin(handLandmark, faceData) {
    if (!faceData) return false;
    const MIN_DIST = 0.10;
    const chin = faceData[152];
    const hand = handLandmark[8];
    const distance = this.utils.calculate_distance(chin, hand);
    return distance < MIN_DIST;
  }

  trackThinkingGesture(handLandmarks, faceData, currentTime) {
    const DURATION = 1500;
    
    if (!handLandmarks || handLandmarks.length === 0) {
      this.isActive = false;
      this.startTime = null;
      return false;
    }

    if (this.isHandNearChin(handLandmarks[0], faceData)) {
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

export { ThinkingGesture };