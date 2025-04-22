from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import shutil
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///studybuddy.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    study_sessions = db.relationship('StudySession', backref='user', lazy=True)
    goals = db.relationship('Goal', backref='user', lazy=True)
    notes = db.relationship('Note', backref='user', lazy=True)
    badges = db.relationship('UserBadge', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)

# Goal model
class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    weekly_hours = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

# Note model
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

# Badge model
class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    criteria = db.Column(db.String(200), nullable=False)
    icon = db.Column(db.String(100), nullable=False)

# User-Badge relationship
class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    earned_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return render_template('dashboard.html')
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
            flash('Username or email already exists')
            return redirect(url_for('register'))
        
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Login successful!')
            return redirect(url_for('dashboard'))
        
        flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    flash('You have been logged out')
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please log in to access the dashboard')
        return redirect(url_for('login'))
    
    return render_template('dashboard.html')

@app.route('/offline')
def offline():
    return render_template('offline.html')

# API Routes for AJAX requests
@app.route('/api/study-session', methods=['POST'])
def add_study_session():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You need to be logged in'}), 401
    
    data = request.json
    user_id = session['user_id']
    
    try:
        # Create new study session
        new_session = StudySession(
            user_id=user_id,
            duration=data.get('duration'),
            date=datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Study session recorded'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/notes', methods=['GET', 'POST'])
def handle_notes():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You need to be logged in'}), 401
    
    user_id = session['user_id']
    
    if request.method == 'GET':
        notes = Note.query.filter_by(user_id=user_id).order_by(Note.updated_at.desc()).all()
        notes_list = [
            {
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'createdAt': note.created_at.isoformat(),
                'updatedAt': note.updated_at.isoformat()
            } for note in notes
        ]
        return jsonify(notes_list)
    
    elif request.method == 'POST':
        data = request.json
        
        try:
            if data.get('id'):
                # Update existing note
                note = Note.query.filter_by(id=data.get('id'), user_id=user_id).first()
                if note:
                    note.title = data.get('title')
                    note.content = data.get('content')
                    note.updated_at = datetime.utcnow()
                else:
                    return jsonify({'success': False, 'message': 'Note not found'}), 404
            else:
                # Create new note
                note = Note(
                    user_id=user_id,
                    title=data.get('title'),
                    content=data.get('content')
                )
                db.session.add(note)
            
            db.session.commit()
            return jsonify({'success': True, 'id': note.id})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/goals', methods=['GET', 'POST'])
def handle_goals():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You need to be logged in'}), 401
    
    user_id = session['user_id']
    
    if request.method == 'GET':
        # Get active goal
        goal = Goal.query.filter_by(user_id=user_id, is_active=True).first()
        if goal:
            return jsonify({
                'id': goal.id,
                'weeklyHours': goal.weekly_hours,
                'isActive': goal.is_active
            })
        return jsonify({})
    
    elif request.method == 'POST':
        data = request.json
        
        try:
            # Deactivate existing goals
            Goal.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
            
            # Create new goal
            new_goal = Goal(
                user_id=user_id,
                weekly_hours=data.get('weeklyHours'),
                is_active=True
            )
            
            db.session.add(new_goal)
            db.session.commit()
            
            return jsonify({'success': True, 'id': new_goal.id})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/badges', methods=['GET'])
def get_badges():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You need to be logged in'}), 401
    
    user_id = session['user_id']
    
    # Get all badges
    all_badges = Badge.query.all()
    # Get user earned badges
    user_badges = UserBadge.query.filter_by(user_id=user_id).all()
    earned_badge_ids = [ub.badge_id for ub in user_badges]
    
    badges_list = [
        {
            'id': badge.id,
            'name': badge.name,
            'description': badge.description,
            'icon': badge.icon,
            'earned': badge.id in earned_badge_ids
        } for badge in all_badges
    ]
    
    return jsonify(badges_list)

@app.route('/api/badges/earn', methods=['POST'])
def earn_badge():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You need to be logged in'}), 401
    
    user_id = session['user_id']
    data = request.json
    badge_id = data.get('badgeId')
    
    # Check if badge exists
    badge = Badge.query.get(badge_id)
    if not badge:
        return jsonify({'success': False, 'message': 'Badge not found'}), 404
    
    # Check if user already has this badge
    existing = UserBadge.query.filter_by(user_id=user_id, badge_id=badge_id).first()
    if existing:
        return jsonify({'success': True, 'message': 'You already earned this badge'})
    
    try:
        # Add badge to user
        user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
        db.session.add(user_badge)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Badge earned',
            'badge': {
                'id': badge.id,
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Varsayılan rozetleri oluşturmak için yardımcı fonksiyon
def create_default_badges_helper():
    if Badge.query.count() == 0:
        default_badges = [
            {'name': 'First Step', 'description': 'Complete your first Pomodoro session', 'criteria': 'sessions >= 1', 'icon': '🚀'},
            {'name': 'Regular', 'description': 'Complete 5 Pomodoro sessions', 'criteria': 'sessions >= 5', 'icon': '⭐'},
            {'name': 'Diligent', 'description': 'Study for a total of 10 hours', 'criteria': 'hours >= 10', 'icon': '🕙'},
            {'name': 'Goal-Oriented', 'description': 'Complete your weekly study goal', 'criteria': 'goals >= 1', 'icon': '🎯'},
            {'name': 'Determined', 'description': 'Study for three consecutive days', 'criteria': 'streak >= 3', 'icon': '🔥'},
            {'name': 'Persistent', 'description': 'Study for seven consecutive days', 'criteria': 'streak >= 7', 'icon': '💪'}
        ]
        
        for badge_data in default_badges:
            badge = Badge(**badge_data)
            db.session.add(badge)
        
        db.session.commit()

# Flask 2.0+ için önerilen yöntem
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_default_badges_helper()
    app.run(debug=True)

# Eski yöntemi kaldırıyorum ve yerine yeni bir yöntem ekliyorum
# ... existing code ...

# Eski kod:
# @app.before_first_request
# def create_tables():
#     db.create_all()

# Yeni kod:
with app.app_context():
    db.create_all()

# Veritabanı yedekleme fonksiyonu
def backup_database():
    """Create a backup of the database file"""
    if os.path.exists('studybuddy.db'):
        backup_dir = 'backups'
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'studybros_{timestamp}.db')
        
        shutil.copy2('studybuddy.db', backup_file)
        print(f"Database backed up to {backup_file}")
        return True
    return False

# Yedekleme için bir API endpoint'i ekliyorum
@app.route('/api/admin/backup', methods=['POST'])
def admin_backup():
    # Gerçek bir uygulamada burada admin kimlik doğrulaması yapılmalıdır
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'You need to be logged in'}), 401
    
    try:
        if backup_database():
            return jsonify({'success': True, 'message': 'Database backup created successfully'})
        else:
            return jsonify({'success': False, 'message': 'Database file not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500