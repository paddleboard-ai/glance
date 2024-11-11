
class ASLHelloGesture {
    constructor() {
        this.isActive = false;
        this.startTime = null;
        this.lastX = null;
        this.directionChanges = 0;
        this.lastDirection = null;
        this.cooldownEnd = false;
        this.displayUntil = null;
    }

    isOpenPalmPosition(handLandmark) {
        // Check if fingers are extended and spread
        const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
        const fingerBases = [5, 9, 13, 17]; // Corresponding finger bases
        let isOpen = true;
        
        for (let i = 0; i < fingerTips.length; i++) {
            const tip = handLandmark[fingerTips[i]];
            const base = handLandmark[fingerBases[i]];
            // In an open palm, fingertips should be above their bases
            if (tip.y > base.y) {
                isOpen = false;
                break;
            }
        }
        
        return isOpen;
    }

    trackHelloGesture(handLandmarks, currentTime) {
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
        if (!this.isOpenPalmPosition(hand)) {
            this.reset();
            return false;
        }

        const MOVEMENT_THRESHOLD = 0.04;
        const REQUIRED_WAVES = 2;
        const GESTURE_TIMEOUT = 1500;
        const DISPLAY_DURATION = 1000; // Display for 1 second
        const COOLDOWN_DURATION = 1500; // Wait 1.5 seconds before allowing next detection

        if (!this.startTime) {
            this.startTime = currentTime;
            this.lastX = hand[9].x;
            return false;
        }

        // Check timeout
        if (currentTime - this.startTime > GESTURE_TIMEOUT) {
            this.reset();
            return false;
        }

        // Track waving movement
        const currentX = hand[9].x;
        const movement = currentX - this.lastX;
        const currentDirection = movement > 0 ? 'right' : movement < 0 ? 'left' : null;

        if (Math.abs(movement) > MOVEMENT_THRESHOLD && 
            currentDirection !== null && 
            currentDirection !== this.lastDirection) {
            
            if (this.lastDirection !== null) {
                this.directionChanges++;
            }
            this.lastDirection = currentDirection;
        }

        this.lastX = currentX;

        if (this.directionChanges >= REQUIRED_WAVES * 2) {
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
        this.lastX = null;
        this.directionChanges = 0;
        this.lastDirection = null;
        // Don't reset isActive, cooldownEnd, or displayUntil here
    }
}

export { ASLHelloGesture };