class HeadShakeGesture {
    constructor() {
        this.isActive = false;
        this.lastXPosition = null;
        this.directionChanges = 0;
        this.lastDirection = null;
        this.gestureStartTime = null;
        this.positions = [];
        this.cooldownEnd = null;
        this.REQUIRED_DIRECTION_CHANGES = 3; // Number of direction changes needed to detect a head shake
        this.GESTURE_TIMEOUT = 2000; // 2 seconds to complete the gesture
        this.MOVEMENT_THRESHOLD = 0.02; // Minimum movement to register as a direction change
        this.COOLDOWN_DURATION = 1000; // 1 second cooldown after detection
    }

    // Calculate the average x position of nose landmarks
    calculateNosePosition(faceData) {
        // Using key nose landmarks:
        // 4 = Nose tip
        // 5 = Bottom of the nose
        // 6 = Bridge of nose
        const nosePoints = [4, 5, 6];
        let sum = 0;
        let count = 0;
        
        for (const point of nosePoints) {
            if (faceData[point]) {
                sum += faceData[point].x;
                count++;
            }
        }
        
        return count > 0 ? sum / count : null;
    }

    // Track the head shake gesture
    trackHeadShake(faceData, currentTime) {
        if (!faceData) {
            this.softReset();
            return false;
        }

        // Check if we're in cooldown period
        if (this.cooldownEnd && currentTime < this.cooldownEnd) {
            return true; // Keep returning true during cooldown
        } else if (this.cooldownEnd && currentTime >= this.cooldownEnd) {
            this.fullReset(); // Reset everything after cooldown
            return false;
        }

        const currentX = this.calculateNosePosition(faceData);
        if (currentX === null) {
            this.softReset();
            return false;
        }

        // Initialize tracking
        if (this.lastXPosition === null) {
            this.lastXPosition = currentX;
            this.gestureStartTime = currentTime;
            return false;
        }

        // Check if gesture has timed out
        if (currentTime - this.gestureStartTime > this.GESTURE_TIMEOUT) {
            this.softReset();
            return false;
        }

        // Calculate movement
        const movement = currentX - this.lastXPosition;
        const currentDirection = movement > 0 ? 'right' : movement < 0 ? 'left' : null;

        // Check if movement exceeds threshold and direction has changed
        if (Math.abs(movement) > this.MOVEMENT_THRESHOLD && 
            currentDirection !== null && 
            currentDirection !== this.lastDirection) {
            
            if (this.lastDirection !== null) {
                this.directionChanges++;
            }
            this.lastDirection = currentDirection;
        }

        // Store current position for next comparison
        this.lastXPosition = currentX;

        // Check if we've detected enough direction changes for a head shake
        if (this.directionChanges >= this.REQUIRED_DIRECTION_CHANGES) {
            this.isActive = true;
            this.cooldownEnd = currentTime + this.COOLDOWN_DURATION;
            return true;
        }

        return false;
    }

    // Soft reset - resets tracking variables but maintains cooldown
    softReset() {
        this.lastXPosition = null;
        this.directionChanges = 0;
        this.lastDirection = null;
        this.gestureStartTime = null;
        this.positions = [];
    }

    // Full reset - resets everything including cooldown
    fullReset() {
        this.softReset();
        this.isActive = false;
        this.cooldownEnd = null;
    }
}

export { HeadShakeGesture };