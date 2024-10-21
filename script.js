import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver, DrawingUtils, GestureRecognizer } = vision;
import GestureTracker from './gesture_tracker.js';
const videoBlendShapes = document.getElementById("video-blend-shapes");
const handStuffContainer = document.getElementById("hand-stuff");

let faceLandmarker;
let gestureRecognizer;
let runningMode = "VIDEO";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 480;

const color_map = {
  fucsia: '#CA2C92',
  teal: '#008080'
}

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
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
  // hands
  gestureRecognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task"
    },
    runningMode,
    numHands: 2
  });
}
createFaceLandmarker();


const video = document.getElementById("webcam");
const canvasElement = document.getElementById(
  "output_canvas"
);

const canvasCtx = canvasElement.getContext("2d");

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById(
    "webcamButton"
  );
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  // getUsermedia parameters.
  const constraints = {
    video: {facingMode:'environment'}
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
let h_results = null;
const drawingUtils = new DrawingUtils(canvasCtx);
const gestureTracker = new GestureTracker();

async function predictWebcam() {
  const radio = video.videoHeight / video.videoWidth;
  video.style.width = videoWidth + "px";
  video.style.height = videoWidth * radio + "px";
  canvasElement.style.width = videoWidth + "px";
  canvasElement.style.height = videoWidth * radio + "px";
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  canvasElement.style.background = '#000'
  // Now let's start detecting the stream.
  if (runningMode !== 'VIDEO') {
    runningMode = 'VIDEO';
    await faceLandmarker.setOptions({ runningMode: runningMode });
    await gestureRecognizer.setOptions({ runningMode: runningMode});
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
    h_results = gestureRecognizer.recognizeForVideo(video, startTimeMs);
  }
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
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
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: color_map.fucsia }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: color_map.teal}
      );
    }
    for (const landmarks of h_results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1
      });
    }
    if (results.faceLandmarks) {
      gestureTracker.updateFaceData(results.faceLandmarks);
      
      if (h_results.landmarks.length > 0) {
        const isThinking = gestureTracker.trackThinkingGesture(
          h_results.landmarks,
          performance.now()
        );
        
        if (isThinking) {
          console.log("Thinking gesture detected!");
          // Handle gesture detection (e.g., update UI)
        }
      }
    }
  }
  ouputBlendShapes(videoBlendShapes, results.faceBlendshapes, 'Facemesh Detection');
  describeHands(handStuffContainer, h_results, 'Hand Gesture Detection');
  //console.log(h_results.handednesses);

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function ouputBlendShapes(el, blendShapes, stats_for) {
  if (!blendShapes.length) {
    return;
  }

  let htmlMaker = `<h3>Stats for ${stats_for}</h3><div class='blend-shape-container'>`;

  blendShapes[0].categories.forEach((shape, index) => {
    htmlMaker += `
      <div class="blend-shape-item" draggable="true" data-index="${index}">
        <span class="blend-shape-label">${shape.displayName || shape.categoryName}</span>
        <div class="blend-shape-bar-container">
          <div class="blend-shape-bar">
            <div class="blend-shape-fill" style="width: ${shape.score * 100}%"></div>
          </div>
          <span class="blend-shape-value">${(shape.score * 100).toFixed(2)}%</span>
        </div>
      </div>
    `;
  });

  htmlMaker += "</div>";
  el.innerHTML = htmlMaker;
}

function describeHands(el, results, stats_for) {
  if (!results.handednesses.length) {
    return;
  }
  // console.log(results.gestures);
  // console.log(results.handednesses);

  let htmlMaker = `<h3>Stats for ${stats_for}</h3><div class='blend-shape-container'>`;

  for ( let i = 0; i < results.handednesses.length; i++) {
    htmlMaker += `
      <div class="blend-shape-item" draggable="true" data-index="${i}">
        <span class="blend-shape-label">${results.handednesses[i][0].displayName } hand</span>
        <div class="blend-shape-bar-container">
          <div class="blend-shape-bar">
            <div class="blend-shape-fill" style="width: ${results.handednesses[i][0].score * 100}%"></div>
          </div>
          <span class="blend-shape-value">${(results.handednesses[i][0].score * 100).toFixed(2)}%</span>
        </div>
      </div>
    `;
  }

  htmlMaker += "</div>";
  el.innerHTML = htmlMaker;

}
