"""
smart_erase.py - 智能消除（涂抹区域修复）
用法: python smart_erase.py <input_path> <output_path> <args_json>

args_json包含: { points: [{x, y}, ...], brushSize: number }
根据涂抹坐标生成掩码，用OpenCV inpaint修复
"""
import cv2
import numpy as np
import sys
import json

def main():
    if len(sys.argv) < 3:
        print("Usage: smart_erase.py <input_path> <output_path> [args_json]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    # 解析参数
    args = {}
    if len(sys.argv) >= 4:
        try:
            args = json.loads(sys.argv[3])
        except json.JSONDecodeError as e:
            print(f"参数解析失败: {e}", file=sys.stderr)
            sys.exit(1)

    points = args.get('points', [])
    brush_size = int(args.get('brushSize', 30))

    if not points:
        print("没有涂抹点", file=sys.stderr)
        sys.exit(1)

    img = cv2.imread(input_path)
    if img is None:
        print(f"无法读取图片: {input_path}", file=sys.stderr)
        sys.exit(1)

    h, w = img.shape[:2]

    # 创建涂抹掩码
    mask = np.zeros((h, w), dtype=np.uint8)
    for pt in points:
        x = int(pt['x'])
        y = int(pt['y'])
        if 0 <= x < w and 0 <= y < h:
            cv2.circle(mask, (x, y), max(brush_size // 2, 1), 255, -1)

    # 膨胀一下，让边缘过渡自然
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)

    # 用NS算法（对大面积消除效果更好）
    result = cv2.inpaint(img, mask, 8, cv2.INPAINT_NS)

    cv2.imwrite(output_path, result)
    with open(output_path, 'rb') as f:
        sys.stdout.buffer.write(f.read())

if __name__ == '__main__':
    main()
