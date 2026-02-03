from flask import Blueprint, render_template

box_pick_bp = Blueprint('box_pick', __name__, template_folder='templates')

@box_pick_bp.route('/')
def index():
    return render_template('box_pick/index.html')
