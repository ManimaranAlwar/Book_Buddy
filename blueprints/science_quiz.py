from flask import Blueprint, render_template, request, jsonify, redirect, url_for
import json
import os

science_quiz_bp = Blueprint('science_quiz', __name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'science_quiz', 'questions.json')

def load_db():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_db(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@science_quiz_bp.route('/')
def index():
    return render_template('science_quiz/index.html')

@science_quiz_bp.route('/admin')
def admin():
    questions = load_db()
    return render_template('science_quiz/admin.html', questions=enumerate(questions))

@science_quiz_bp.route('/api/questions', methods=['GET'])
def get_questions():
    return jsonify(load_db())

@science_quiz_bp.route('/api/add', methods=['POST'])
def add_question():
    db = load_db()
    new_q = {
        "question": request.form.get('question'),
        "options": [
            request.form.get('opt1'),
            request.form.get('opt2'),
            request.form.get('opt3'),
            request.form.get('opt4')
        ],
        "answer": request.form.get('correct')
    }
    db.append(new_q)
    save_db(db)
    return redirect(url_for('science_quiz.admin'))
