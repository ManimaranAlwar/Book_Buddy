from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
import json
import os
import sqlite3
from datetime import timedelta

young_scientist_bp = Blueprint('young_scientist', __name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'young_scientist', 'questions.json')
DB_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'young_scientist', 'users.db')

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       username TEXT UNIQUE, 
                       password TEXT)''')
    conn.commit()
    conn.close()

# Ensure DB is initialized
init_db()

def load_db():
    if not os.path.exists(DATA_FILE): return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try: return json.load(f)
        except: return []

def save_db(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

@young_scientist_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
        user = cursor.fetchone()
        conn.close()

        if user:
            session.permanent = True
            session['user'] = username
            return redirect(url_for('young_scientist.index'))
        
        return "Invalid login! <a href='/young_scientist/login'>Try again</a>"
    
    return render_template('young_scientist/login.html')

@young_scientist_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        if not username or not password:
            return "Please provide a name and a spell! <a href='/young_scientist/register'>Try again</a>"

        conn = sqlite3.connect(DB_FILE)
        try:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
            conn.commit()
            return redirect(url_for('young_scientist.login'))
        except sqlite3.IntegrityError:
            return "That name is already taken! <a href='/young_scientist/register'>Try another</a>"
        finally:
            conn.close()
            
    return render_template('young_scientist/register.html')

@young_scientist_bp.route('/')
def index():
    if 'user' not in session:
        return redirect(url_for('young_scientist.login'))
    return render_template('young_scientist/index.html', username=session['user'])

@young_scientist_bp.route('/admin')
def admin():
    return render_template('young_scientist/admin.html', recipes=enumerate(load_db()))

@young_scientist_bp.route('/api/recipes', methods=['GET'])
def get_recipes():
    return jsonify(load_db())

@young_scientist_bp.route('/api/add', methods=['POST'])
def add_recipe():
    db = load_db()
    new_recipe = {
        "item1": request.form.get('item1').strip(),
        "item2": request.form.get('item2').strip(),
        "result": request.form.get('result').strip(),
        "explanation": request.form.get('explanation')
    }
    db.append(new_recipe)
    save_db(db)
    return redirect(url_for('young_scientist.admin'))

@young_scientist_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('young_scientist.login'))
