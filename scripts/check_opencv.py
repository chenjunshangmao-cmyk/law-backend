# check_opencv.py
try:
    import cv2
    print('cv2 OK:', cv2.__version__)
except ImportError:
    print('cv2 NOT INSTALLED')
except Exception as e:
    print('cv2 ERROR:', e)
