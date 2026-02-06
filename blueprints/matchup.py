from flask import Blueprint, render_template

matchup_bp = Blueprint('matchup', __name__)

@matchup_bp.route('/')
def index():
    return render_template('matchup/index.html')
