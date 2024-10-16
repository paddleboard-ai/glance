import cv2
import mediapipe as mp
import numpy as np

color_map = {
    'fucsia': (202,44,146),
    'teal': (0,128,128),
    'white': (255,255,255)
}

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
# More info about mediapipe's facial landmarks 
# https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
mp_drawing = mp.solutions.drawing_utils
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1, color=color_map['white'])

def create_blank_image(height, width):
    return np.zeros((height, width, 3), np.uint8)

def draw_colored_eyes(image, landmarks):
    # Right eye (green)
    right_eye = [landmarks[p] for p in [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]]
    right_eye_points = np.array([(int(p.x * image.shape[1]), int(p.y * image.shape[0])) for p in right_eye])
    cv2.fillPoly(image, [right_eye_points], color_map['teal'])

    # Left eye (red)
    left_eye = [landmarks[p] for p in [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382]]
    left_eye_points = np.array([(int(p.x * image.shape[1]), int(p.y * image.shape[0])) for p in left_eye])
    cv2.fillPoly(image, [left_eye_points], color_map['fucsia'])

def detect_eye_roll(landmarks, threshold=0.1):
    # Get iris landmarks
    left_iris = landmarks[468]
    right_iris = landmarks[473]

    # Get eye top and bottom landmarks
    left_eye_top = landmarks[159]
    left_eye_bottom = landmarks[145]
    right_eye_top = landmarks[386]
    right_eye_bottom = landmarks[374]

    # Calculate the relative position of iris
    left_eye_height = left_eye_bottom.y - left_eye_top.y
    right_eye_height = right_eye_bottom.y - right_eye_top.y
    
    left_iris_position = (left_iris.y - left_eye_top.y) / left_eye_height
    right_iris_position = (right_iris.y - right_eye_top.y) / right_eye_height

    # Check if both irises are close to the top of the eyes
    return left_iris_position < threshold and right_iris_position < threshold

def is_mouth_open(landmarks, image_shape):
    upper_lip = landmarks[13]
    lower_lip = landmarks[14]
    distance = abs(upper_lip.y - lower_lip.y) * image_shape[0]
    return distance > 20  # Threshold in pixels

def main():
    cap = cv2.VideoCapture(0)
    # Set desired FPS. Some applications benefit from higher FPS capture some you actually want slower
    desired_fps = 12
    cap.set(cv2.CAP_PROP_FPS, desired_fps)
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        image = cv2.flip(image, 1)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)

        blank_image = create_blank_image(image.shape[0], image.shape[1])

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    image=blank_image,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=drawing_spec,
                    connection_drawing_spec=drawing_spec)
                
                draw_colored_eyes(blank_image, face_landmarks.landmark)
                
                # Detect eye roll
                eye_rolling = detect_eye_roll(face_landmarks.landmark)
                # cv2.putText(blank_image, f"Eye Rolling: {'Yes' if eye_rolling else 'No'}", 
                #             (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                print(f"Eye Rolling: {'Yes' if eye_rolling else 'No'}")
                # Detect mouth open
                mouth_open = is_mouth_open(face_landmarks.landmark, blank_image.shape)
                print(f"Mouth Open: {'Yes' if mouth_open else 'No'}")


        cv2.imshow('Face Mesh with Eye Roll Detection', blank_image)
        if cv2.waitKey(5) & 0xFF == 27:  # Press 'ESC' to exit
            break

    face_mesh.close()
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()