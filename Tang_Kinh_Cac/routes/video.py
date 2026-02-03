from flask import Blueprint, render_template

video_bp = Blueprint('video', __name__)

@video_bp.route('/video')
def mode_video():
    return render_template('mode_video.html')