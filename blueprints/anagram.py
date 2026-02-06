from flask import Blueprint, render_template

anagram_bp = Blueprint('anagram', __name__)

@anagram_bp.route('/')
def index():
    return render_template('anagram/index.html')
