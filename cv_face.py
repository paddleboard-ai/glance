import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1, color=(255, 255, 255))

def create_blank_image(height, width):
    return np.zeros((height, width, 3), np.uint8)

def is_mouth_open(landmarks, image_shape):
    upper_lip = landmarks[13]
    lower_lip = landmarks[14]
    distance = abs(upper_lip.y - lower_lip.y) * image_shape[0]
    return distance > 20  # Threshold in pixels

def main():
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        # Flip the image horizontally for a later selfie-view display
        image = cv2.flip(image, 1)
        
        # Convert the BGR image to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)

        # Create a blank black image
        blank_image = create_blank_image(image.shape[0], image.shape[1])

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # Draw the face mesh on the blank image
                mp_drawing.draw_landmarks(
                    image=blank_image,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=drawing_spec,
                    connection_drawing_spec=drawing_spec)
                
                # Check if mouth is open
                mouth_open = is_mouth_open(face_landmarks.landmark, blank_image.shape)
                def mouth_text(mo):
                    if mo:
                        return 'Soyface'
                    else:
                        return 'Not Soyface'
                
                cv2.putText(blank_image, mouth_text(mouth_open), 
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        cv2.imshow('Face Mesh', blank_image)
        if cv2.waitKey(5) & 0xFF == 27:  # Press 'ESC' to exit
            break

    face_mesh.close()
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()