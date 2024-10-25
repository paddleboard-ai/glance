class ThumbsUpGesture {

    trackThumbsUpGesture(gestureResults) {
    
        for (const handGestures of gestureResults.gestures) {
          for (const gesture of handGestures) {
            if (gesture.categoryName === 'Thumb_Up' && gesture.score > 0.60) {
              return true;
            }
          }
        }
        return false;
      }

}

export { ThumbsUpGesture };