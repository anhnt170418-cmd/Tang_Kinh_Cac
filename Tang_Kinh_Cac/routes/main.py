import os
import urllib.parse
from flask import Blueprint, render_template, send_from_directory
from config import COMIC_DIR

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

# Phục vụ file (Dùng chung cho cả app)
@main_bp.route('/read/<path:filepath>')
def serve_file(filepath):
    filepath = urllib.parse.unquote(filepath)
    return send_from_directory(COMIC_DIR, filepath)