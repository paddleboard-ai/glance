import cv2
import subprocess
import re


def list_video_devices_windows():
    try:
        output = subprocess.check_output(["powershell", "-Command",
                                          "Get-PnpDevice | Where-Object {$_.Class -eq 'Image' -and $_.Status -eq 'OK'} | Select-Object FriendlyName"],
                                         universal_newlines=True)
        devices = re.findall(r'(?<=FriendlyName\s:\s).+', output)
        return devices
    except subprocess.CalledProcessError:
        print("Error executing PowerShell command. Make sure you have the necessary permissions.")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []


def try_open_camera(index):
    cap = cv2.VideoCapture(index)
    if cap.isOpened():
        ret, frame = cap.read()
        cap.release()
        return ret
    return False


def main():
    print("Detecting video devices...")
    devices = list_video_devices_windows()

    if devices:
        print("Found the following video devices:")
        for device in devices:
            print(device)
    else:
        print("No video devices detected by the operating system.")

    print("\nTrying to open cameras using OpenCV...")
    for i in range(10):  # Try indices 0 to 9
        if try_open_camera(i):
            print(f"Successfully opened camera at index {i}")
        else:
            print(f"Failed to open camera at index {i}")

    print("\nIf no cameras were successfully opened, try the following:")
    print("1. Check if the webcam is being used by another application.")
    print("2. Restart your computer and try again.")
    print("3. Update your webcam drivers.")
    print("4. Try using a different USB port.")
    print("5. Check Device Manager to ensure the webcam is properly recognized.")


if __name__ == "__main__":
    main()