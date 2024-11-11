import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver, DrawingUtils, GestureRecognizer } = vision;
import { GestureTracker } from './gesture_tracker.js';

let faceLandmarker;
let gestureRecognizer;
let runningMode = "VIDEO";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 800;

const color_map = Object.freeze({
  fucsia: '#CA2C92',
  teal: '#008080',
  red: '#FF0000',
  green: '#00FF00',
  light_grey: '#C0C0C070',
  grey: '#E0E0E0',
  solid_black: '#000'
});

async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  });
  
  gestureRecognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task"
    },
    delegate: "GPU",
    runningMode,
    numHands: 2
  });
}
createFaceLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }


  const button = document.getElementById("webcamButton");
  const buttonIcon = button.querySelector('[data-lucide="camera"]') ||
                      button.querySelector('[data-lucide="camera-off"]');
  const buttonText = button.querySelector('span');

  if (webcamRunning === true) {
    webcamRunning = false;
    
    // Update button state
    buttonIcon.setAttribute('data-lucide', 'camera');
    buttonText.textContent = 'Start Camera';
    
    // Stop video tracks
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    
    lucide.createIcons();
    return;
  }

  webcamRunning = true;
  
  // Update button state
  buttonIcon.setAttribute('data-lucide', 'camera-off');
  buttonText.textContent = 'Stop Camera';
  
  lucide.createIcons();

  const constraints = {
    video: {
      facingMode: 'environment'
    }
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      // Set canvas dimensions once video metadata is loaded
      const ratio = video.videoHeight / video.videoWidth;
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      canvasElement.style.width = videoWidth + "px";
      canvasElement.style.height = (videoWidth * ratio) + "px";
      video.style.width = videoWidth + "px";
      video.style.height = (videoWidth * ratio) + "px";
    });
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
let h_results = null;
const drawingUtils = new DrawingUtils(canvasCtx);
const gestureTracker = new GestureTracker();

async function predictWebcam() {
  // Ensure canvas dimensions are valid
  if (!video.videoWidth || !video.videoHeight) {
    if (webcamRunning) {
      window.requestAnimationFrame(predictWebcam);
    }
    return;
  }

  // Update canvas dimensions if they don't match video
  if (canvasElement.width !== video.videoWidth || 
      canvasElement.height !== video.videoHeight) {
    const ratio = video.videoHeight / video.videoWidth;
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = (videoWidth * ratio) + "px";
  }

  if (runningMode !== 'VIDEO') {
    runningMode = 'VIDEO';
    await faceLandmarker.setOptions({ runningMode: runningMode });
    await gestureRecognizer.setOptions({ runningMode: runningMode });
  }

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
    h_results = gestureRecognizer.recognizeForVideo(video, startTimeMs);
  }

  // Clear the canvas before drawing
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.fillStyle = color_map.solid_black;
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: color_map.light_grey, lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: color_map.fucsia }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: color_map.fucsia }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: color_map.teal }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: color_map.teal }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: color_map.grey }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: color_map.grey }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: color_map.fucsia }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: color_map.teal }
      );
    }
    
    if (h_results.landmarks) {
      for (const landmarks of h_results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          {
            color: color_map.green,
            lineWidth: 5
          }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: color_map.red,
          lineWidth: 1
        });
      }
    }

    if (results.faceLandmarks.length > 0) {
      gestureTracker.updateFaceData(results.faceLandmarks);
      gestureTracker.trackHeadShakeGesture(performance.now());
      
      if (h_results.landmarks?.length > 0) {
        gestureTracker.trackThinkingGesture(h_results.landmarks, performance.now());
        gestureTracker.trackSilenceGesture(h_results.landmarks, performance.now());
        gestureTracker.trackMindBlownGesture(h_results.landmarks, performance.now());
        gestureTracker.trackThumbsUpGesture(h_results);
        gestureTracker.trackHeadShakeGesture(performance.now());
        gestureTracker.trackASLYesGesture(h_results.landmarks, performance.now());
        gestureTracker.trackASLHelloGesture(h_results.landmarks, performance.now());
        gestureTracker.trackASLNoGesture(h_results.landmarks, performance.now());
        gestureTracker.trackASLThankYouGesture(h_results.landmarks, performance.now());
      }
      
      gestureTracker.drawGestureText(canvasCtx);
    }
  }

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}