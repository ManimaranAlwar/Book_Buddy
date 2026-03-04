import os
import json
from flask import Blueprint, render_template, jsonify

hidden_bp = Blueprint('hidden', __name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'hidden', 'levels.json')

@hidden_bp.route("/")
def index():
    return render_template('hidden/index.html')

@hidden_bp.route("/api/levels")
def get_levels():
    with open(DATA_FILE, 'r') as f:
        return jsonify(json.load(f))
