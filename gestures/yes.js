class ASLYesGesture {
    constructor() {
        this.isActive = false;
        this.startTime = null;
        this.lastY = null;
        this.directionChanges = 0;
        this.lastDirection = null;
        this.cooldownEnd = false;
        this.displayUntil = null;
    }

    isFistPosition(handLandmark) {
        // Check if fingers are curled into a fist
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
        const fingerBases = [5, 9, 13, 17]; // Corresponding finger bases
        let isFist = true;
        
        for (let i = 0; i < fingerTips.length; i++) {
            const tip = handLandmark[fingerTips[i]];
            const base = handLandmark[fingerBases[i]];
            // In a fist, fingertips should be below their bases
            if (tip.y < base.y) {
                isFist = false;
                break;
            }
        }
        
        return isFist;
    }

    trackYesGesture(handLandmarks, currentTime) {
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
        if (!this.isFistPosition(hand)) {
            this.reset();
            return false;
        }

        const MOVEMENT_THRESHOLD = 0.03;
        const REQUIRED_NODS = 2;
        const GESTURE_TIMEOUT = 1500;
        const DISPLAY_DURATION = 1000; // Display for 1 second
        const COOLDOWN_DURATION = 1500; // Wait 1.5 seconds before allowing next detection

        if (!this.startTime) {
            this.startTime = currentTime;
            this.lastY = hand[9].y;
            return false;
        }

        // Check timeout
        if (currentTime - this.startTime > GESTURE_TIMEOUT) {
            this.reset();
            return false;
        }

        // Track nodding movement
        const currentY = hand[9].y;
        const movement = currentY - this.lastY;
        const currentDirection = movement > 0 ? 'down' : movement < 0 ? 'up' : null;

        if (Math.abs(movement) > MOVEMENT_THRESHOLD && 
            currentDirection !== null && 
            currentDirection !== this.lastDirection) {
            
            if (this.lastDirection !== null) {
                this.directionChanges++;
            }
            this.lastDirection = currentDirection;
        }

        this.lastY = currentY;

        if (this.directionChanges >= REQUIRED_NODS * 2) {
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
        this.directionChanges = 0;
        this.lastDirection = null;
        // Don't reset isActive, cooldownEnd, or displayUntil here
    }
}


export { ASLYesGesture };