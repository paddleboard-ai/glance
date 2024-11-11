class ASLThankYouGesture {
    constructor() {
        this.isActive = false;
        this.startTime = null;
        this.initialY = null;
        this.maxYChange = 0;
        this.cooldownEnd = false;
        this.displayUntil = null;
        this.gesturePhase = 'start';
    }

    isOpenPalmPosition(handLandmark) {
        // Fingers should be together and extended
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
        const fingerBases = [5, 9, 13, 17]; // Corresponding finger bases
        let isOpen = true;
        
        // Check if fingers are extended
        for (let i = 0; i < fingerTips.length; i++) {
            const tip = handLandmark[fingerTips[i]];
            const base = handLandmark[fingerBases[i]];
            if (tip.y > base.y) {
                isOpen = false;
                break;
            }
        }
        
        // Check if fingers are close together
        for (let i = 0; i < fingerTips.length - 1; i++) {
            const distance = Math.abs(handLandmark[fingerTips[i]].x - handLandmark[fingerTips[i + 1]].x);
            if (distance > 0.04) { // Threshold for finger spread
                isOpen = false;
                break;
            }
        }
        
        return isOpen;
    }

    isNearChin(handLandmark, faceData) {
        if (!faceData) return false;
        
        // Key face landmarks for chin area
        const chin = faceData[152]; // Bottom of chin
        const leftJaw = faceData[149]; // Left jaw point near chin
        const rightJaw = faceData[377]; // Right jaw point near chin
        
        // Use middle finger tip as reference point for hand position
        const handPoint = handLandmark[12]; // Middle finger tip
        
        // Calculate distance to chin area
        const distanceToChin = Math.sqrt(
            Math.pow(handPoint.x - chin.x, 2) + 
            Math.pow(handPoint.y - chin.y, 2)
        );
        
        // Check if hand is near chin (adjust threshold as needed)
        const CHIN_PROXIMITY_THRESHOLD = 0.1;
        return distanceToChin < CHIN_PROXIMITY_THRESHOLD;
    }

    trackThankYouGesture(handLandmarks, faceData, currentTime) {
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

        if (!handLandmarks?.length || !faceData) {
            this.reset();
            return false;
        }

        const hand = handLandmarks[0];
        if (!this.isOpenPalmPosition(hand)) {
            this.reset();
            return false;
        }

        const MOVEMENT_THRESHOLD = 0.15; // Minimum vertical movement required
        const GESTURE_TIMEOUT = 1500;
        const DISPLAY_DURATION = 1000;
        const COOLDOWN_DURATION = 1500;

        if (!this.startTime) {
            if (this.isNearChin(hand, faceData)) {
                this.startTime = currentTime;
                this.initialY = hand[9].y;
                this.gesturePhase = 'start';
            }
            return false;
        }

        // Check timeout
        if (currentTime - this.startTime > GESTURE_TIMEOUT) {
            this.reset();
            return false;
        }

        // Track forward and downward movement
        const currentY = hand[9].y;
        const yChange = currentY - this.initialY;
        this.maxYChange = Math.max(this.maxYChange, yChange);

        // Check for sufficient downward movement
        if (this.maxYChange > MOVEMENT_THRESHOLD) {
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
        this.initialY = null;
        this.maxYChange = 0;
        this.gesturePhase = 'start';
        // Don't reset isActive, cooldownEnd, or displayUntil here
    }
}

export { ASLThankYouGesture };