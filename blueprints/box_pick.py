from flask import Blueprint, render_template

box_pick_bp = Blueprint('box_pick', __name__)

@box_pick_bp.route('/')
def index():
    return render_template('box_pick/index.html')
