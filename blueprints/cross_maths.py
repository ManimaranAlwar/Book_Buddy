import json
import os
from flask import Blueprint, render_template

cross_maths_bp = Blueprint('cross_maths', __name__, template_folder='templates')

@cross_maths_bp.route('/')
@cross_maths_bp.route('/level/<level_id>')
def index(level_id="1"):
    try:
        with open('data/cross_maths.json', 'r', encoding='utf-8') as f:
            all_levels = json.load(f)
            
        level_data = all_levels.get(str(level_id))
        
        if not level_data:
            return render_template('cross_maths/update.html')
            
        return render_template('cross_maths/index.html', 
                             level_id=level_id, 
                             matrix=level_data['matrix'], 
                             answers=level_data['answers'])
    except Exception as e:
        return f"Error loading level: {str(e)}"

@cross_maths_bp.route('/update')
def update_page():
    return render_template('cross_maths/update.html')
