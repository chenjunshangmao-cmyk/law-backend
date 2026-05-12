import cv2
import numpy as np

# 创建一个400x600的测试图片，带水印
img = np.full((400, 600, 3), (240, 240, 240), dtype=np.uint8)
# 放一些彩色方块模拟真实图片内容
cv2.rectangle(img, (50, 50), (250, 200), (200, 100, 50), -1)
cv2.rectangle(img, (300, 50), (550, 180), (50, 180, 100), -1)
cv2.rectangle(img, (50, 250), (550, 350), (100, 120, 200), -1)
# 加水印文字
cv2.putText(img, 'WATERMARK', (150, 300), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
cv2.putText(img, 'DOUBAI AI', (200, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 2)
# 保存
cv2.imwrite('C:\\Users\\Administrator\\test_watermark.png', img)
print('Test image created')
