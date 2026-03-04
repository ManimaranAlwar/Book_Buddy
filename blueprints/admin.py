import os
import json
import functools
from flask import (
    Blueprint, render_template, request, redirect,
    url_for, session, flash, jsonify
)

admin_bp = Blueprint('admin', __name__, template_folder='../templates/admin')

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _data_path(filename):
    return os.path.join(DATA_DIR, filename)


def _read(filename):
    with open(_data_path(filename), 'r', encoding='utf-8') as f:
        return json.load(f)


def _write(filename, data):
    with open(_data_path(filename), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def login_required(view):
    @functools.wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin.login'))
        return view(*args, **kwargs)
    return wrapped


def get_admin_password():
    return os.environ.get('ADMIN_PASSWORD', 'bookbuddyintern-2026')


# ─────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin.dashboard'))
    error = None
    if request.method == 'POST':
        pwd = request.form.get('password', '')
        if pwd == get_admin_password():
            session['admin_logged_in'] = True
            return redirect(url_for('admin.dashboard'))
        else:
            error = 'Incorrect password. Please try again.'
    return render_template('admin/login.html', error=error)


@admin_bp.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin.login'))


# ─────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────

@admin_bp.route('/')
@login_required
def dashboard():
    stats = {}
    try:
        stats['anagram'] = len(_read('anagram.json'))
    except Exception:
        stats['anagram'] = '?'
    try:
        stats['box_pick'] = len(_read('box_pick.json'))
    except Exception:
        stats['box_pick'] = '?'
    try:
        stats['matchup'] = len(_read('matchup.json'))
    except Exception:
        stats['matchup'] = '?'
    try:
        stats['space_run'] = len(_read('space_run.json'))
    except Exception:
        stats['space_run'] = '?'
    try:
        stats['cross_maths'] = len(_read('cross_maths.json'))
    except Exception:
        stats['cross_maths'] = '?'
    try:
        stats['science_quiz'] = len(_read('science_quiz/questions.json'))
    except Exception:
        stats['science_quiz'] = '?'
    try:
        stats['young_scientist'] = len(_read('young_scientist/questions.json'))
    except Exception:
        stats['young_scientist'] = '?'
    try:
        stats['hidden'] = len(_read('hidden/levels.json'))
    except Exception:
        stats['hidden'] = '?'
    try:
        stats['mr'] = 1 # Single config file
    except Exception:
        stats['mr'] = '?'
    return render_template('admin/dashboard.html', stats=stats)


# ─────────────────────────────────────────────
# ANAGRAM — word + hint list
# ─────────────────────────────────────────────

@admin_bp.route('/anagram', methods=['GET'])
@login_required
def anagram():
    words = _read('anagram.json')
    return render_template('admin/anagram.html', words=words)


@admin_bp.route('/anagram/add', methods=['POST'])
@login_required
def anagram_add():
    words = _read('anagram.json')
    word = request.form.get('word', '').strip().upper()
    hint = request.form.get('hint', '').strip()
    if word and hint:
        words.append({'word': word, 'hint': hint})
        _write('anagram.json', words)
        flash(f'Word "{word}" added!', 'success')
    else:
        flash('Word and hint are required.', 'error')
    return redirect(url_for('admin.anagram'))


@admin_bp.route('/anagram/edit/<int:idx>', methods=['POST'])
@login_required
def anagram_edit(idx):
    words = _read('anagram.json')
    if 0 <= idx < len(words):
        words[idx]['word'] = request.form.get('word', '').strip().upper()
        words[idx]['hint'] = request.form.get('hint', '').strip()
        _write('anagram.json', words)
        flash('Word updated!', 'success')
    return redirect(url_for('admin.anagram'))


@admin_bp.route('/anagram/delete/<int:idx>', methods=['POST'])
@login_required
def anagram_delete(idx):
    words = _read('anagram.json')
    if 0 <= idx < len(words):
        removed = words.pop(idx)
        _write('anagram.json', words)
        flash(f'Deleted "{removed["word"]}".', 'success')
    return redirect(url_for('admin.anagram'))


# ─────────────────────────────────────────────
# BOX PICK — riddles with correctWords/wrongWords
# ─────────────────────────────────────────────

@admin_bp.route('/box-pick', methods=['GET'])
@login_required
def box_pick():
    puzzles = _read('box_pick.json')
    return render_template('admin/box_pick.html', puzzles=puzzles)


@admin_bp.route('/box-pick/add', methods=['POST'])
@login_required
def box_pick_add():
    puzzles = _read('box_pick.json')
    riddle = request.form.get('riddle', '').strip()
    emoji = request.form.get('emoji', '').strip()
    correct_raw = request.form.get('correctWords', '')
    wrong_raw = request.form.get('wrongWords', '')
    correct = [w.strip() for w in correct_raw.split(',') if w.strip()]
    wrong = [w.strip() for w in wrong_raw.split(',') if w.strip()]
    if riddle and correct:
        new_id = max((p.get('id', 0) for p in puzzles), default=0) + 1
        puzzles.append({'id': new_id, 'riddle': riddle, 'emoji': emoji,
                        'correctWords': correct, 'wrongWords': wrong})
        _write('box_pick.json', puzzles)
        flash('Puzzle added!', 'success')
    else:
        flash('Riddle and at least one correct word are required.', 'error')
    return redirect(url_for('admin.box_pick'))


@admin_bp.route('/box-pick/edit/<int:idx>', methods=['POST'])
@login_required
def box_pick_edit(idx):
    puzzles = _read('box_pick.json')
    if 0 <= idx < len(puzzles):
        puzzles[idx]['riddle'] = request.form.get('riddle', '').strip()
        puzzles[idx]['emoji'] = request.form.get('emoji', '').strip()
        correct_raw = request.form.get('correctWords', '')
        wrong_raw = request.form.get('wrongWords', '')
        puzzles[idx]['correctWords'] = [w.strip() for w in correct_raw.split(',') if w.strip()]
        puzzles[idx]['wrongWords'] = [w.strip() for w in wrong_raw.split(',') if w.strip()]
        _write('box_pick.json', puzzles)
        flash('Puzzle updated!', 'success')
    return redirect(url_for('admin.box_pick'))


@admin_bp.route('/box-pick/delete/<int:idx>', methods=['POST'])
@login_required
def box_pick_delete(idx):
    puzzles = _read('box_pick.json')
    if 0 <= idx < len(puzzles):
        puzzles.pop(idx)
        _write('box_pick.json', puzzles)
        flash('Puzzle deleted.', 'success')
    return redirect(url_for('admin.box_pick'))


# ─────────────────────────────────────────────
# MATCHUP — levels with pairs
# ─────────────────────────────────────────────

@admin_bp.route('/matchup', methods=['GET'])
@login_required
def matchup():
    levels = _read('matchup.json')
    return render_template('admin/matchup.html', levels=levels)


@admin_bp.route('/matchup/add', methods=['POST'])
@login_required
def matchup_add():
    levels = _read('matchup.json')
    title = request.form.get('title', '').strip()
    words_raw = request.form.getlist('word[]')
    matches_raw = request.form.getlist('match[]')
    pairs = [{'word': w.strip(), 'match': m.strip()}
             for w, m in zip(words_raw, matches_raw) if w.strip() and m.strip()]
    if title and pairs:
        new_id = max((l.get('id', 0) for l in levels), default=0) + 1
        levels.append({'id': new_id, 'title': title, 'pairs': pairs})
        _write('matchup.json', levels)
        flash('Level added!', 'success')
    else:
        flash('Title and at least one pair are required.', 'error')
    return redirect(url_for('admin.matchup'))


@admin_bp.route('/matchup/edit/<int:idx>', methods=['POST'])
@login_required
def matchup_edit(idx):
    levels = _read('matchup.json')
    if 0 <= idx < len(levels):
        levels[idx]['title'] = request.form.get('title', '').strip()
        words_raw = request.form.getlist('word[]')
        matches_raw = request.form.getlist('match[]')
        levels[idx]['pairs'] = [
            {'word': w.strip(), 'match': m.strip()}
            for w, m in zip(words_raw, matches_raw) if w.strip() and m.strip()
        ]
        _write('matchup.json', levels)
        flash('Level updated!', 'success')
    return redirect(url_for('admin.matchup'))


@admin_bp.route('/matchup/delete/<int:idx>', methods=['POST'])
@login_required
def matchup_delete(idx):
    levels = _read('matchup.json')
    if 0 <= idx < len(levels):
        removed = levels.pop(idx)
        _write('matchup.json', levels)
        flash(f'Deleted level "{removed.get("title", "")}"', 'success')
    return redirect(url_for('admin.matchup'))


# ─────────────────────────────────────────────
# SPACE RUN — quiz questions
# ─────────────────────────────────────────────

@admin_bp.route('/space-run', methods=['GET'])
@login_required
def space_run():
    questions = _read('space_run.json')
    return render_template('admin/space_run.html', questions=questions)


@admin_bp.route('/space-run/add', methods=['POST'])
@login_required
def space_run_add():
    questions = _read('space_run.json')
    q = request.form.get('q', '').strip()
    opt0 = request.form.get('opt0', '').strip()
    opt1 = request.form.get('opt1', '').strip()
    opt2 = request.form.get('opt2', '').strip()
    correct = int(request.form.get('correct', 0))
    hint = request.form.get('hint', '').strip()
    if q and opt0 and opt1 and opt2:
        questions.append({'q': q, 'options': [opt0, opt1, opt2], 'correct': correct, 'hint': hint})
        _write('space_run.json', questions)
        flash('Question added!', 'success')
    else:
        flash('Question and all 3 options are required.', 'error')
    return redirect(url_for('admin.space_run'))


@admin_bp.route('/space-run/edit/<int:idx>', methods=['POST'])
@login_required
def space_run_edit(idx):
    questions = _read('space_run.json')
    if 0 <= idx < len(questions):
        questions[idx]['q'] = request.form.get('q', '').strip()
        questions[idx]['options'] = [
            request.form.get('opt0', '').strip(),
            request.form.get('opt1', '').strip(),
            request.form.get('opt2', '').strip(),
        ]
        questions[idx]['correct'] = int(request.form.get('correct', 0))
        questions[idx]['hint'] = request.form.get('hint', '').strip()
        _write('space_run.json', questions)
        flash('Question updated!', 'success')
    return redirect(url_for('admin.space_run'))


@admin_bp.route('/space-run/delete/<int:idx>', methods=['POST'])
@login_required
def space_run_delete(idx):
    questions = _read('space_run.json')
    if 0 <= idx < len(questions):
        questions.pop(idx)
        _write('space_run.json', questions)
        flash('Question deleted.', 'success')
    return redirect(url_for('admin.space_run'))


# ─────────────────────────────────────────────
# CROSS MATHS — grid levels (stored as dict keyed "1","2",...)
# ─────────────────────────────────────────────

@admin_bp.route('/cross-maths', methods=['GET'])
@login_required
def cross_maths():
    levels = _read('cross_maths.json')
    return render_template('admin/cross_maths.html', levels=levels)


@admin_bp.route('/cross-maths/edit/<key>', methods=['POST'])
@login_required
def cross_maths_edit(key):
    levels = _read('cross_maths.json')
    if key in levels:
        title = request.form.get('title', '').strip()
        matrix_raw = request.form.get('matrix', '[]')
        answers_raw = request.form.get('answers', '{}')
        try:
            matrix = json.loads(matrix_raw)
            answers = json.loads(answers_raw)
            levels[key]['title'] = title
            levels[key]['matrix'] = matrix
            levels[key]['answers'] = answers
            _write('cross_maths.json', levels)
            flash(f'Level {key} updated!', 'success')
        except json.JSONDecodeError as e:
            flash(f'Invalid JSON: {e}', 'error')
    return redirect(url_for('admin.cross_maths'))


@admin_bp.route('/cross-maths/add', methods=['POST'])
@login_required
def cross_maths_add():
    levels = _read('cross_maths.json')
    title = request.form.get('title', '').strip()
    matrix_raw = request.form.get('matrix', '[]')
    answers_raw = request.form.get('answers', '{}')
    try:
        matrix = json.loads(matrix_raw)
        answers = json.loads(answers_raw)
        new_key = str(max((int(k) for k in levels.keys()), default=0) + 1)
        levels[new_key] = {'title': title, 'matrix': matrix, 'answers': answers}
        _write('cross_maths.json', levels)
        flash(f'Level {new_key} added!', 'success')
    except json.JSONDecodeError as e:
        flash(f'Invalid JSON: {e}', 'error')
    return redirect(url_for('admin.cross_maths'))


@admin_bp.route('/cross-maths/delete/<key>', methods=['POST'])
@login_required
def cross_maths_delete(key):
    levels = _read('cross_maths.json')
    if key in levels:
        levels.pop(key)
        _write('cross_maths.json', levels)
        flash(f'Level {key} deleted.', 'success')
    return redirect(url_for('admin.cross_maths'))


# ─────────────────────────────────────────────
# SCIENCE QUIZ
# ─────────────────────────────────────────────

@admin_bp.route('/science-quiz', methods=['GET'])
@login_required
def science_quiz():
    questions = _read('science_quiz/questions.json')
    return render_template('admin/science_quiz.html', questions=questions)


@admin_bp.route('/science-quiz/add', methods=['POST'])
@login_required
def science_quiz_add():
    questions = _read('science_quiz/questions.json')
    q = request.form.get('question', '').strip()
    opts = [
        request.form.get('opt1', '').strip(),
        request.form.get('opt2', '').strip(),
        request.form.get('opt3', '').strip(),
        request.form.get('opt4', '').strip()
    ]
    ans = request.form.get('correct', '').strip()
    if q and all(opts) and ans:
        questions.append({'question': q, 'options': opts, 'answer': ans})
        _write('science_quiz/questions.json', questions)
        flash('Question added!', 'success')
    return redirect(url_for('admin.science_quiz'))


@admin_bp.route('/science-quiz/delete/<int:idx>', methods=['POST'])
@login_required
def science_quiz_delete(idx):
    questions = _read('science_quiz/questions.json')
    if 0 <= idx < len(questions):
        questions.pop(idx)
        _write('science_quiz/questions.json', questions)
        flash('Question deleted.', 'success')
    return redirect(url_for('admin.science_quiz'))


# ─────────────────────────────────────────────
# YOUNG SCIENTIST (Recipes)
# ─────────────────────────────────────────────

@admin_bp.route('/young-scientist', methods=['GET'])
@login_required
def young_scientist():
    recipes = _read('young_scientist/questions.json')
    return render_template('admin/young_scientist.html', recipes=recipes)


@admin_bp.route('/young-scientist/add', methods=['POST'])
@login_required
def young_scientist_add():
    recipes = _read('young_scientist/questions.json')
    item1 = request.form.get('item1', '').strip()
    item2 = request.form.get('item2', '').strip()
    res = request.form.get('result', '').strip()
    expl = request.form.get('explanation', '').strip()
    if item1 and item2 and res:
        recipes.append({
            'item1': item1,
            'item2': item2,
            'result': res,
            'explanation': expl
        })
        _write('young_scientist/questions.json', recipes)
        flash('Recipe added!', 'success')
    return redirect(url_for('admin.young_scientist'))


@admin_bp.route('/young-scientist/delete/<int:idx>', methods=['POST'])
@login_required
def young_scientist_delete(idx):
    recipes = _read('young_scientist/questions.json')
    if 0 <= idx < len(recipes):
        recipes.pop(idx)
        _write('young_scientist/questions.json', recipes)
        flash('Recipe deleted.', 'success')
    return redirect(url_for('admin.young_scientist'))


# ─────────────────────────────────────────────
# HIDDEN OBJECT
# ─────────────────────────────────────────────

@admin_bp.route('/hidden', methods=['GET'])
@login_required
def hidden():
    levels = _read('hidden/levels.json')
    return render_template('admin/hidden_object.html', levels=levels)


# ─────────────────────────────────────────────
# MIXED REALITY
# ─────────────────────────────────────────────

@admin_bp.route('/mixed-reality', methods=['GET', 'POST'])
@login_required
def mixed_reality():
    config = _read('mr/math.json')
    if request.method == 'POST':
        config['spawnRate'] = int(request.form.get('spawnRate', 320))
        config['currentSpeed'] = float(request.form.get('currentSpeed', 0.0022))
        config['speedIncrement'] = float(request.form.get('speedIncrement', 0.0001))
        config['mathRange'] = int(request.form.get('mathRange', 5))
        _write('mr/math.json', config)
        flash('MR config updated!', 'success')
        return redirect(url_for('admin.mixed_reality'))
    return render_template('admin/mixed_reality.html', config=config)
