import { Utils } from '../utils.js';

class MindBlownGesture {
    
    constructor () {
        this.utils = new Utils();
        this.cooldownEnd = false;
        this.phase = 'none';
        this.startTime = null;
        this.isActive = false;
        this.previousPhase = null;
        this.lastPhaseTime = null;

    }

    areFingersTogether(handLandmark) {
        // Check if all fingertips are close to each other
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
        let closeCount = 0;
        const threshold = 0.08;
        
        for (let i = 0; i < fingerTips.length - 1; i++) {
          const distance = this.utils.calculate_distance(
            handLandmark[fingerTips[i]], 
            handLandmark[fingerTips[i + 1]]
          );
          if (distance < threshold) {
            closeCount++;
          }
        }
        
        return closeCount >= 2;
      }
    
      areHandsNearTemples(handLandmarks, faceData) {
        if (handLandmarks.length !== 2) return false;
        const threshold = 0.1;
        // Get temple positions and add some nearby reference points
        const leftTemplePoints = [234, 233, 235].map(idx => faceData[idx]);
        const rightTemplePoints = [454, 453, 455].map(idx => faceData[idx]);
    
        // Check distances to any of the temple area points
        let leftHandNear = false;
        let rightHandNear = false;
    
        for (const handLandmark of handLandmarks) {
          // Use multiple finger points for more reliable detection
          const fingerPoints = [8, 7, 6, 12]; // Index finger points and middle finger tip
          
          for (const fingerIdx of fingerPoints) {
            for (const templePoint of leftTemplePoints) {
              if (this.utils.calculate_distance(templePoint, handLandmark[fingerIdx]) < threshold) {
                leftHandNear = true;
              }
            }
            
            for (const templePoint of rightTemplePoints) {
              if (this.utils.calculate_distance(templePoint, handLandmark[fingerIdx]) < threshold) {
                rightHandNear = true;
              }
            }
          }
        }
    
        return leftHandNear && rightHandNear;
      }
    
      areHandsExploding(handLandmarks) {
        if (handLandmarks.length !== 2) return false;
        const spreadMin = 0.1;
        const distance_min = 0.3;
    
        // Check if hands are moving outward and fingers are somewhat spread
        const leftHand = handLandmarks[0];
        const rightHand = handLandmarks[1];
    
        // Calculate the spread of fingers for each hand
        const fingerSpread = (hand) => {
          const thumbTip = hand[4];
          const pinkyTip = hand[20];
          return this.utils.calculate_distance(thumbTip, pinkyTip);
        };
    
        const leftSpread = fingerSpread(leftHand);
        const rightSpread = fingerSpread(rightHand);
    
        // Check if hands are far enough apart
        const handDistance = this.utils.calculate_distance(leftHand[8], rightHand[8]);
        
        return (leftSpread > spreadMin || rightSpread > spreadMin) && handDistance > distance_min;
      }
    
      trackMindBlownGesture(handLandmarks, faceData, currentTime) {
        
        // Check cooldown period
        if (this.cooldownEnd && currentTime < this.cooldownEnd) {
          return false;
        }
    
        if (!handLandmarks || handLandmarks.length !== 2) {
          if (this.phase !== 'none') {
            this.previousPhase = this.phase;
          }
          this.phase = 'none';
          this.startTime = null;
          this.isActive = false;
          return false;
        }
    
        // Initialize timing if needed
        if (!this.startTime) {
          this.startTime = currentTime;
          this.lastPhaseTime = currentTime;
        }
    
        const timeSinceLastPhase = currentTime - this.lastPhaseTime;
    
        // Store current phase before updating
        this.previousPhase = this.phase;
    
        switch (this.phase) {
          case 'none':
            if (this.areFingersTogether(handLandmarks[0]) && 
                this.areFingersTogether(handLandmarks[1])) {
              this.phase = 'fingers-together';
              this.lastPhaseTime = currentTime;
            }
            break;
    
          case 'fingers-together':
            if (timeSinceLastPhase > 200) { // Reduced from 300
              if (this.areHandsNearTemples(handLandmarks, faceData)) {
                this.phase = 'temple-touch';
                this.lastPhaseTime = currentTime;
              } else if (timeSinceLastPhase > 1500) { // Increased from 1000
                this.phase = 'none';
              }
            }
            break;
    
          case 'temple-touch':
            if (timeSinceLastPhase > 150) { // Reduced from 200
              if (this.areHandsExploding(handLandmarks)) {
                this.phase = 'explosion';
                this.lastPhaseTime = currentTime;
                this.isActive = true;
                return true;
              } else if (timeSinceLastPhase > 1500) { // Increased from 1000
                this.phase = 'none';
              }
            }
            break;
    
          case 'explosion':
            if (timeSinceLastPhase > 800) { // Reduced from 1000
              this.phase = 'none';
              this.isActive = false;
              // Set cooldown period
              this.cooldownEnd = currentTime + 500; // 500ms cooldown
            }
            break;
        }
    
        // Debug logging for gesture phases
        if (this.phase !== this.previousPhase) {
          console.log(`Mind Blown Phase: ${this.phase}`);
        }
    
        return this.isActive;
      }
}

export { MindBlownGesture };