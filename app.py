from flask import Flask, render_template, send_from_directory, jsonify
import os
import json
import random
from datetime import datetime

# Import Blueprints
from blueprints.anagram import anagram_bp
from blueprints.box_pick import box_pick_bp
from blueprints.cross_maths import cross_maths_bp
from blueprints.matchup import matchup_bp
from blueprints.space_run import space_run_bp
from blueprints.admin import admin_bp
from blueprints.mr import mr_bp
from blueprints.young_scientist import young_scientist_bp
from blueprints.science_quiz import science_quiz_bp
from blueprints.hidden import hidden_bp

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-123')

# Register Blueprints
app.register_blueprint(anagram_bp, url_prefix='/anagram')
app.register_blueprint(box_pick_bp, url_prefix='/box-pick')
app.register_blueprint(cross_maths_bp, url_prefix='/cross-maths')
app.register_blueprint(matchup_bp, url_prefix='/matchup')
app.register_blueprint(space_run_bp, url_prefix='/space-run')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(mr_bp, url_prefix='/mr')
app.register_blueprint(young_scientist_bp, url_prefix='/young-scientist')
app.register_blueprint(science_quiz_bp, url_prefix='/science-quiz')
app.register_blueprint(hidden_bp, url_prefix='/hidden')

@app.route('/')
def dashboard():
    return render_template('index.html')

@app.route('/health')
def health():
    return "OK"

# --- UNIVERSAL API FOR DAILY CONTENT ---
@app.route('/api/daily/<game_type>')
def get_daily_content(game_type):
    """
    Returns specific content for the day to prevent cheating.
    """
    date_seed = datetime.now().strftime('%Y%m%d')
    random.seed(date_seed)

    try:
        if game_type == 'anagram':
            with open('data/anagram.json', 'r', encoding='utf-8') as f:
                words = json.load(f)
            # Pick 10 random words for the day
            daily_words = random.sample(words, min(len(words), 10))
            return jsonify(daily_words)
        




        
            
        elif game_type == 'box_pick':
            with open('data/box_pick.json', 'r', encoding='utf-8') as f:
                puzzles = json.load(f)
            # Pick 1 puzzle based on day of year
            day_of_year = datetime.now().timetuple().tm_yday
            puzzle = puzzles[(day_of_year - 1) % len(puzzles)]
            return jsonify(puzzle)

        elif game_type == 'matchup':
            with open('data/matchup.json', 'r', encoding='utf-8') as f:
                levels = json.load(f)
            return jsonify(levels) # Matchup sends all levels, logic is reliable in client

        elif game_type == 'space_run':
            with open('data/space_run.json', 'r', encoding='utf-8') as f:
                questions = json.load(f)
            random.shuffle(questions)
            return jsonify(questions[:15]) # Send 15 qs

        elif game_type == 'cross_maths':
            with open('data/cross_maths.json', 'r', encoding='utf-8') as f:
                levels = json.load(f)
            return jsonify(levels)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Unknown game type"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5001)
