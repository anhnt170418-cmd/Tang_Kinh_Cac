from flask import Flask
# Import file cấu hình
import config
# Import các "Trưởng phòng"
from routes.main import main_bp
from routes.comic import comic_bp
from routes.novel import novel_bp
from routes.video import video_bp

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = config.JSON_AS_ASCII

# Đăng ký các Blueprint (Thuê nhân viên về làm)
app.register_blueprint(main_bp)
app.register_blueprint(comic_bp)
app.register_blueprint(novel_bp)
app.register_blueprint(video_bp)

if __name__ == '__main__':
    print(f"--- APP LAI ĐANG CHẠY TẠI: {config.BASE_DIR} ---")
    app.run(debug=True, port=5000)