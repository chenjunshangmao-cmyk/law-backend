"""
remove_watermark.py - 图片去水印
用法: python remove_watermark.py <input_path> <output_path> <args_json>

自动检测图片中的高亮区域（水印特征），用OpenCV inpaint修复
"""
import cv2
import numpy as np
import sys
import json
import os

def main():
    if len(sys.argv) < 3:
        print("Usage: remove_watermark.py <input_path> <output_path> [args_json]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    img = cv2.imread(input_path)
    if img is None:
        print(f"无法读取图片: {input_path}", file=sys.stderr)
        sys.exit(1)

    h, w = img.shape[:2]

    # 多策略去水印
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 策略1: 检测白色/高亮区域（最常见水印）
    _, mask_white = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

    # 策略2: 检测低饱和度高亮度区域（半透明水印）
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 60, 255])
    mask_hsv = cv2.inRange(hsv, lower_white, upper_white)

    # 策略3: 边缘检测定位文字区域
    edges = cv2.Canny(gray, 50, 150)
    kernel_dilate = np.ones((3, 3), np.uint8)
    edges_dilated = cv2.dilate(edges, kernel_dilate, iterations=2)

    # 合并掩码
    mask = cv2.bitwise_or(mask_white, mask_hsv)
    mask = cv2.bitwise_or(mask, edges_dilated)

    # 如果掩码覆盖太多（>40%面积），可能是误判，缩小范围
    coverage = np.sum(mask > 0) / (h * w)
    if coverage > 0.4:
        # 只保留最亮的部分
        _, mask_restrict = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY)
        mask = cv2.bitwise_and(mask, mask_restrict)

    # 膨胀掩码，确保覆盖水印边缘
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)

    # 如果没检测到水印，返回原图
    if np.sum(mask > 0) < 50:
        cv2.imwrite(output_path, img)
        with open(output_path, 'rb') as f:
            sys.stdout.buffer.write(f.read())
        return

    # OpenCV Telea修复
    result = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)

    cv2.imwrite(output_path, result)
    with open(output_path, 'rb') as f:
        sys.stdout.buffer.write(f.read())

if __name__ == '__main__':
    main()
