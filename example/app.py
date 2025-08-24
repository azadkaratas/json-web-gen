from flask import Flask, jsonify, send_from_directory, request, session, redirect, url_for
import os, secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='.')
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(16))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Mock user DB (in production, use a real database)
USERS = {
    'admin': generate_password_hash("password123")
}

@app.route('/')
def root():
    if not session.get('logged_in'):
        return send_from_directory('.', 'login.html')
    return send_from_directory('.', 'index.html')

# Block direct access to index.html
@app.route('/index.html')
def index_protected():
    if not session.get('logged_in'):
        return redirect('/login.html')
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path == "index.html":
        return redirect('/')
    return send_from_directory('.', path)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if username in USERS and check_password_hash(USERS[username], password):
        session['logged_in'] = True
        session['username'] = username
        return jsonify({'success': True, 'message': 'Login successful'})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out'})

@app.route('/api/check-login', methods=['GET'])
def check_login():
    return jsonify({'logged_in': session.get('logged_in', False)})

# API Endpoints for GET requests
@app.route('/api/internet-status', methods=['GET'])
def internet_status():
    return jsonify({
        "isConnected": True,
        "isConnecting": False,
        "isDslConnected": True,
        "dslStatus": "M-net otomatik",
        "receiveSpeed": 586.2,
        "sendSpeed": 117.2
    })

@app.route('/api/device-info', methods=['GET'])
def device_info():
    return jsonify({ "deviceCount": 3 })

@app.route('/api/system-info', methods=['GET'])
def system_info():
    return jsonify({ "modelName": "SmartHome Hub", "osVersion": "2.1.0" })

@app.route('/api/energy-stats', methods=['GET'])
def energy_stats():
    return jsonify({ "total-consumption": 120.5, "power-status": True })

@app.route('/api/lights', methods=['GET'])
def lights():
    return jsonify([
        { "light-name": "Living Room Light", "is-on": True, "brightness": 80 },
        { "light-name": "Kitchen Light", "is-on": False, "brightness": 50 }
    ])

@app.route('/api/thermostat', methods=['GET'])
def thermostat():
    return jsonify({
        "temperature": 22,
        "mode": "auto",
        "eco-mode": False,
        "fan-speed": "low"
    })

@app.route('/api/camera-notes', methods=['GET'])
def camera_notes():
    return jsonify({ "camera-notes": "No notes available." })

@app.route('/api/device-logs', methods=['GET'])
def device_logs():
    logs = "[2025-04-24 10:00:00] System started\n[2025-04-24 10:01:00] Light turned on"
    return logs, 200, {'Content-Type': 'text/plain'}

# API Endpoints for POST requests (action endpoints)
@app.route('/api/reset-energy', methods=['POST'])
def reset_energy():
    return jsonify({ "success": True, "message": "Energy data reset successfully." })

@app.route('/api/update-lights', methods=['POST'])
def update_lights():
    print("Updated lights:", request.json)
    return jsonify({ "success": True, "message": "Light settings updated successfully." })

@app.route('/api/save-thermostat', methods=['POST'])
def save_thermostat():
    print("Thermostat settings:", request.json)
    return jsonify({ "success": True, "message": "Thermostat settings saved successfully." })

@app.route('/api/save-camera-settings', methods=['POST'])
def save_camera_settings():
    print("Camera settings:", request.json)
    return jsonify({ "success": True, "message": "Camera settings saved successfully." })

@app.route('/api/clear-logs', methods=['POST'])
def clear_logs():
    return jsonify({ "success": True, "message": "Logs cleared successfully." })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)