from flask import Blueprint, jsonify, render_template
import os
from config import NOVEL_DIR

novel_bp = Blueprint('novel', __name__)

@novel_bp.route('/novel')
def mode_novel():
    return render_template('mode_novel.html')

@novel_bp.route('/api/novels')
def get_novels():
    if not os.path.exists(NOVEL_DIR): return jsonify([])
    return jsonify([f for f in os.listdir(NOVEL_DIR) if f.endswith(('.txt', '.html'))])