# Face Detection and Eye Roll Detection

This project uses OpenCV and MediaPipe to perform real-time face detection, face mesh rendering, and eye roll detection using a webcam feed.

## Features

- Real-time face detection
- Face mesh rendering
- Colored eye highlighting
- Eye roll detection
- Mouth open/close detection
- Webcam integration

## Requirements

- Python 3.7+
- OpenCV
- MediaPipe
- NumPy

## Installation

1. Clone this repository:
   ```
   git clone git@github.com:paddleboard-ai/glance.git
   cd glance
   ```

2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

Run the script with:

```
python cv_face.py
```

- The program will open your webcam feed and display a face mesh with colored eyes.
- Eye roll detection results will be printed to the console.
- Press 'ESC' to exit the program.

## How it works

1. The script captures video from your webcam.
2. Each frame is processed to detect facial landmarks using MediaPipe's Face Mesh.
3. A face mesh is drawn on a blank canvas, with the eyes highlighted in different colors.
4. The position of the iris relative to the eye is used to detect eye rolling (this is extremelly tricky and often doesn't work)
5. The processed image is displayed, and eye roll, mouth open detection results are printed to the console.

## Customization

You can customize the colors used in the visualization by modifying the `color_map` dictionary at the beginning of the script. You may also play with the desired_fps and see if you can get better results with more or less frames.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check [issues page](https://github.com/paddleboard-ai/glance/issues) if you want to contribute.

## License

[Apache 2](https://choosealicense.com/licenses/apache-2.0/)
