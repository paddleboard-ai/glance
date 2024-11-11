import { Utils } from '../utils.js'
class ASLNoGesture {
    constructor() {
        this.isActive = false;
        this.startTime = null;
        this.lastY = null;
        this.closureCount = 0;
        this.lastState = null;
        this.cooldownEnd = false;
        this.displayUntil = null;
        this.utils = new Utils();
    }

    areFingersClosed(handLandmark) {
        // Check distance between thumb tip and index/middle tips
        const thumbTip = handLandmark[4];
        const indexTip = handLandmark[8];
        const middleTip = handLandmark[12];
        
        // Calculate distances
        const thumbToIndexDist = this.utils.calculate_distance(thumbTip, indexTip);
        
        const thumbToMiddleDist = this.utils.calculate_distance(thumbTip, middleTip);
        
        // If both distances are small, fingers are touching thumb
        return thumbToIndexDist < 0.1 && thumbToMiddleDist < 0.1;
    }

    areIndexAndMiddleExtended(handLandmark) {
        // Check if index and middle are extended while others are curled
        const indexMCP = handLandmark[5];  // Index base
        const middleMCP = handLandmark[9]; // Middle base
        const indexPIP = handLandmark[6];  // Index middle joint
        const middlePIP = handLandmark[10]; // Middle middle joint
        const indexTip = handLandmark[8];  // Index tip
        const middleTip = handLandmark[12]; // Middle tip
        
        // Check if index and middle are relatively straight
        const indexStraight = indexTip.y < indexPIP.y && indexPIP.y < indexMCP.y;
        const middleStraight = middleTip.y < middlePIP.y && middlePIP.y < middleMCP.y;
        
        // Check if ring and pinky are curled
        const ringTip = handLandmark[16];
        const pinkyTip = handLandmark[20];
        const ringBase = handLandmark[13];
        const pinkyBase = handLandmark[17];
        const fingersCurled = ringTip.y > ringBase.y && pinkyTip.y > pinkyBase.y;
        
        return indexStraight && middleStraight && fingersCurled;
    }

    trackNoGesture(handLandmarks, currentTime) {
        // Check if we're in display period
        if (this.displayUntil && currentTime < this.displayUntil) {
            return true;
        }

        // Reset display flag if display period is over
        if (this.displayUntil && currentTime >= this.displayUntil) {
            this.displayUntil = null;
            this.isActive = false;
        }

        // Check cooldown period
        if (this.cooldownEnd && currentTime < this.cooldownEnd) {
            return false;
        }

        if (!handLandmarks?.length) {
            this.reset();
            return false;
        }

        const hand = handLandmarks[0];
        const REQUIRED_CLOSURES = 2; // Number of open-close cycles needed
        const GESTURE_TIMEOUT = 1500;
        const DISPLAY_DURATION = 1000;
        const COOLDOWN_DURATION = 1500;

        if (!this.startTime) {
            this.startTime = currentTime;
        }

        // Check timeout
        if (currentTime - this.startTime > GESTURE_TIMEOUT) {
            this.reset();
            return false;
        }

        // Track finger positions
        const currentlyClosed = this.areFingersClosed(hand);
        const currentlyExtended = this.areIndexAndMiddleExtended(hand);
        
        // Detect state changes
        let currentState = 'invalid';
        if (currentlyExtended && !currentlyClosed) {
            currentState = 'open';
        } else if (currentlyClosed) {
            currentState = 'closed';
        }

        // Count complete open-close cycles
        if (this.lastState === 'open' && currentState === 'closed') {
            this.closureCount++;
        }
        
        this.lastState = currentState;

        // Check if we've completed enough cycles
        if (this.closureCount >= REQUIRED_CLOSURES) {
            this.isActive = true;
            this.displayUntil = currentTime + DISPLAY_DURATION;
            this.cooldownEnd = currentTime + COOLDOWN_DURATION;
            this.reset();
            return true;
        }

        return false;
    }

    reset() {
        this.startTime = null;
        this.lastY = null;
        this.closureCount = 0;
        this.lastState = null;
        // Don't reset isActive, cooldownEnd, or displayUntil here
    }
}

export { ASLNoGesture };