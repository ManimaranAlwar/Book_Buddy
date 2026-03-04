import os
import json
from flask import Blueprint, render_template, jsonify

mr_bp = Blueprint('mr', __name__)

CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'mr', 'math.json')

@mr_bp.route('/')
def index():
    return render_template('mr/index.html')

@mr_bp.route('/api/config')
def get_config():
    with open(CONFIG_FILE, 'r') as f:
        return jsonify(json.load(f))
