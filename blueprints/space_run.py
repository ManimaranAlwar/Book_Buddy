from flask import Blueprint, render_template

space_run_bp = Blueprint('space_run', __name__)

@space_run_bp.route('/')
def index():
    return render_template('space_run/index.html')
