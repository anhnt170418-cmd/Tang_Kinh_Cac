import os
import json
import urllib.parse
from flask import Blueprint, jsonify, request, send_from_directory, render_template
# Import biến đường dẫn từ file config ở thư mục cha
from config import COMIC_DIR

# Tạo Blueprint
comic_bp = Blueprint('comic', __name__)

# =========================================================
# 1. GIAO DIỆN CHÍNH (SPA)
# =========================================================
@comic_bp.route('/comic')
def mode_comic():
    return render_template('mode_comic.html')

# =========================================================
# 2. PHỤC VỤ FILE TĨNH (Ảnh truyện, Bìa...)
# =========================================================
# Đường dẫn kiểu: /read/Tên Truyện/cover.jpg hoặc /read/Tên Truyện/Chap 1/01.jpg
@comic_bp.route('/read/<path:filepath>')
def read_comic_file(filepath):
    # Giải mã đường dẫn (đề phòng tiếng Việt bị mã hóa %20...)
    filepath = urllib.parse.unquote(filepath)
    return send_from_directory(COMIC_DIR, filepath)

# =========================================================
# 3. CÁC API DỮ LIỆU
# =========================================================

# --- API Mới: Lấy tất cả thể loại (Dùng cho bộ lọc) ---
@comic_bp.route('/api/all-genres')
def get_all_genres():
    if not os.path.exists(COMIC_DIR): return jsonify([])
    
    all_genres = set()
    # Lấy danh sách thư mục truyện
    folder_names = [d for d in os.listdir(COMIC_DIR) if os.path.isdir(os.path.join(COMIC_DIR, d))]
    
    for name in folder_names:
        genres = []
        meta_path = os.path.join(COMIC_DIR, name, 'meta.json')
        txt_path = os.path.join(COMIC_DIR, name, 'info.txt')
        
        # Ưu tiên đọc từ meta.json
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    genres = data.get('genres', [])
            except: pass
        # Nếu không có json thì quét tạm info.txt
        elif os.path.exists(txt_path):
            try:
                with open(txt_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if "Thể loại:" in line:
                            parts = line.split(":")[1].split(",")
                            genres = [g.strip() for g in parts if g.strip()]
            except: pass
            
        for g in genres:
            all_genres.add(g)
            
    return jsonify(sorted(list(all_genres)))


# --- API: Lấy danh sách truyện (Kèm info cơ bản để hiển thị Home/List) ---
@comic_bp.route('/api/comics')
def get_comics():
    if not os.path.exists(COMIC_DIR): return jsonify([])
    
    comics_list = []
    folder_names = [d for d in os.listdir(COMIC_DIR) if os.path.isdir(os.path.join(COMIC_DIR, d))]
    
    for name in folder_names:
        # Cấu trúc mặc định
        comic_info = {
            "folder_name": name,
            "title": name,
            "cover": f"/read/{name}/cover.jpg",
            "author": "Unknown",
            "genres": [] # Quan trọng để lọc
        }
        
        # Thử đọc meta.json để lấy thông tin chuẩn xác hơn
        meta_path = os.path.join(COMIC_DIR, name, 'meta.json')
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    comic_info['title'] = data.get('title', name)
                    comic_info['author'] = data.get('author', 'Unknown')
                    comic_info['genres'] = data.get('genres', [])
            except: pass
            
        comics_list.append(comic_info)
    
    return jsonify(comics_list)


# --- API: Lấy chi tiết 1 truyện (Info đầy đủ) ---
@comic_bp.route('/api/comic-info/<path:comic_name>')
def get_comic_info(comic_name):
    comic_name = urllib.parse.unquote(comic_name)
    folder_path = os.path.join(COMIC_DIR, comic_name)
    
    info = {
        "title": comic_name,
        "author": "Đang cập nhật",
        "status": "Đang tiến hành",
        "description": "",
        "genres": []
    }
    
    # Ưu tiên đọc meta.json
    meta_path = os.path.join(folder_path, 'meta.json')
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                info = json.load(f)
        except: pass
    else:
        # Fallback đọc info.txt cũ
        txt_path = os.path.join(folder_path, 'info.txt')
        if os.path.exists(txt_path):
            try:
                with open(txt_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("Tác giả:"): info['author'] = line.split(":", 1)[1].strip()
                        if line.startswith("Thể loại:"): 
                            raw = line.split(":", 1)[1]
                            info['genres'] = [g.strip() for g in raw.split(",") if g.strip()]
                        if line.startswith("Tình trạng:"): info['status'] = line.split(":", 1)[1].strip()
                        # Mô tả sơ sài (nếu cần logic phức tạp hơn thì tính sau)
            except: pass
            
    return jsonify(info)


# --- API: Lưu thông tin truyện (Tạo/Sửa meta.json) ---
@comic_bp.route('/api/save-comic-info/<path:comic_name>', methods=['POST'])
def save_comic_info(comic_name):
    comic_name = urllib.parse.unquote(comic_name)
    folder_path = os.path.join(COMIC_DIR, comic_name)
    
    # Dữ liệu từ Client gửi lên
    data = request.json
    
    try:
        # Lưu thẳng vào meta.json
        with open(os.path.join(folder_path, 'meta.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return jsonify({"success": True})
    except Exception as e:
        print(f"Lỗi lưu file: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- API: Lấy danh sách Chapter ---
@comic_bp.route('/api/comic/<path:comic_name>')
def get_chapters(comic_name):
    comic_name = urllib.parse.unquote(comic_name)
    comic_path = os.path.join(COMIC_DIR, comic_name)
    
    if not os.path.exists(comic_path): return jsonify([])

    chapters = []
    # Chỉ lấy các thư mục con (là chapter)
    items = os.listdir(comic_path)
    for item in items:
        if os.path.isdir(os.path.join(comic_path, item)):
            chapters.append(item)
            
    # Sắp xếp chapter (Cố gắng sort theo số: Chap 1, Chap 2, Chap 10...)
    # Logic sort đơn giản: nếu có số thì sort theo số, không thì ABC
    try:
        chapters.sort(key=lambda x: int(''.join(filter(str.isdigit, x))) if any(c.isdigit() for c in x) else x)
    except:
        chapters.sort()
        
    return jsonify(chapters)


# --- API: Lấy danh sách Ảnh của 1 Chapter ---
@comic_bp.route('/api/comic/<path:comic_name>/<path:chapter_name>')
def get_images(comic_name, chapter_name):
    comic_name = urllib.parse.unquote(comic_name)
    chapter_name = urllib.parse.unquote(chapter_name)
    
    chapter_path = os.path.join(COMIC_DIR, comic_name, chapter_name)
    
    if not os.path.exists(chapter_path): return jsonify([])
    
    images = []
    valid_exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    
    for f in os.listdir(chapter_path):
        if any(f.lower().endswith(ext) for ext in valid_exts):
            images.append(f)
            
    # Sắp xếp ảnh a-z (thường là page_001, page_002...)
    images.sort()
    
    return jsonify(images)