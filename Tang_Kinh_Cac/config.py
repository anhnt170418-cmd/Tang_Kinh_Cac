import os

# Đường dẫn gốc (Nơi chứa file config.py này)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Đường dẫn đến các kho dữ liệu
LIBRARY_DIR = os.path.join(BASE_DIR, 'library')
COMIC_DIR = os.path.join(LIBRARY_DIR, 'comics')
NOVEL_DIR = os.path.join(LIBRARY_DIR, 'novels')
VIDEO_DIR = os.path.join(LIBRARY_DIR, 'videos')

# Cấu hình khác
JSON_AS_ASCII = False