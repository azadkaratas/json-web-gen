# JSON-Web-Gen Library

`JSON-Web-Gen` is a lightweight and flexible JavaScript library designed to generate dynamic, API-driven web interfaces from a single `config.json` file. It provides a tabbed interface with a variety of UI elements, supports API integration for fetching data and triggering actions, and is built to be generic, making it adaptable to various use cases such as device management, smart home systems, or network administration panels.

**You can reach out and test the live demo in: http://json-web-gen-example.onrender.com/**. It takes some time to run initially because of Render.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Setup API Server](#setup-api-server)
- [Login System](#login-system)
- [Configuration](#configuration)
  - [Structure of `config.json`](#structure-of-configjson)
  - [Supported Item Types](#supported-item-types)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Dynamic Tabbed Interface**: Create a hierarchical structure with tabs and subtabs.
- **Wide Range of UI Elements**: Supports 16 different item types, from simple inputs to complex lists and custom HTML.
- **API Integration**: Fetch data from APIs and trigger actions with POST requests.
- **Responsive Design**: Built with Bootstrap 5 for a mobile-friendly layout.
- **Custom HTML Support**: Embed custom HTML templates with dynamic data from APIs.
- **Generic Core**: The `script.js` core is generic, allowing for reuse across different projects without modification.
- **Login System**: Optional login requirement via config (see below).

## Installation
1. Clone the repository:
2. Navigate to the project directory:
   ```
   cd json-web-gen
   ```
3. Install Python dependencies (required for the API server):
   ```
   pip install flask werkzeug
   ```
4. Start the API server (see [Setup API Server](#setup-api-server) for details).

### Dependencies
- **Bootstrap 5**: Included via CDN in `index.html` for styling and responsive layout.
- **Bootstrap JS Bundle**: Included for handling accordion and collapse functionality.
- **Python Flask**: Required for running the API server (`app.py`).

## Setup API Server
`JSON-Web-Gen` relies on a backend API server to fetch data and handle actions. A sample `app.py` file is provided to simulate the required API endpoints.

1. Ensure Python is installed on your system.
2. Install Flask and Werkzeug:
   ```
   pip install flask werkzeug
   ```
3. Run the API server:
   ```
   python app.py
   ```
   This will start a server at `http://localhost:8000`, serving both static files (HTML, CSS, JS) and API endpoints.
4. Open your browser and navigate to `http://localhost:8000`.

### Required API Endpoints
The library fetches data from and sends actions to specific API endpoints defined in `config.json`. Your backend server must implement these endpoints. The provided `app.py` includes mock implementations for testing. Below are the types of endpoints you need to support:

- **GET Endpoints**: Used to fetch data for UI elements (e.g., `/api/settings` for a `select` item or `/api/logs` for a `fileReader`).
  - Expected response: JSON object for most items (e.g., `{"value": "example"}`), plain text for `fileReader`.
- **POST Endpoints**: Used for actions triggered by `button` items (e.g., `/api/save-settings`).
  - Expected request: JSON body containing the current values of all input elements in the subtab.
  - Expected response: JSON object (e.g., `{"success": true, "message": "Settings saved"}`).

You can modify `app.py` to connect to a real backend or database as needed.

## Login System

**New Feature:**  
You can now require users to log in before accessing the application. To enable this, add the following line to your `config.json` file:

```json
"login": true
```

When `"login": true` is set, the application will show a login screen and require authentication before allowing access to the main interface.

### Example config.json snippet:
```json
{
  "title": "Smart Home Manager",
  "login": true,
  ...
}
```

### API Endpoints for Login

The backend must implement the following endpoints for login functionality:

- `POST /api/login` — Accepts `{ username, password }` and returns `{ success, message }`.
- `POST /api/logout` — Logs out the user.
- `GET /api/check-login` — Returns `{ logged_in: true/false }`.

Sample implementation is provided in `app.py` (Python/Flask).

### Example Python Flask API Server

You can run the backend with Python Flask. Below is a minimal example (`app.py`) that supports login and all required endpoints:

```python
from flask import Flask, jsonify, send_from_directory, request, session, redirect
import os, secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='.')
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(16))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

USERS = {
    'admin': generate_password_hash("password123")
}

@app.route('/')
def root():
    if not session.get('logged_in'):
        return send_from_directory('.', 'login.html')
    return send_from_directory('.', 'index.html')

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

# ... other API endpoints as in app.py ...

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```

#### How to Run with Flask

1. Install Flask and Werkzeug:
   ```
   pip install flask werkzeug
   ```
2. Save the above code as `app.py` in your project directory.
3. Run the server:
   ```
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:8000`.

---

## Configuration
The entire interface is driven by a single `config.json` file, which defines the structure, content, and behavior of the application.

### Structure of `config.json`
The `config.json` file has the following structure:

- **title**: The title of the application (displayed in the browser tab).
- **header**: Branding information.
  - **projectName**: Name of the project, displayed in the header.
  - **logo**: URL to the logo image, displayed in the header and sidebar.
- **tabs**: Array of tab objects, defining the navigation structure.
  - **id**: Unique identifier for the tab.
  - **title**: Display name of the tab.
  - **subtabs**: Optional array of subtab objects (same structure as tabs).
  - **fetchFromAPI**: Optional API endpoint to fetch data for the tab.
  - **description**: Optional description for the tab/subtab, displayed in the content area.
- **content**: Array of content objects, each linked to a subtab via `subtabId`.
  - **subtabId**: ID of the subtab this content belongs to.
  - **items**: Array of UI elements (see Supported Item Types below).

### Supported Item Types
The library supports 16 different UI elements, each defined as an item in the `content` section of `config.json`. Below is a detailed list of all supported item types, their properties, and usage examples.

#### 1. `text`
A text input field for user input.
- **id**: Unique identifier.
- **label**: Label for the input.
- **fetchFromAPI**: Optional API endpoint to fetch the initial value.
- **value**: Default value.
- **readonly**: Optional, set to `true` to make the input read-only.
**Example**:
```json
{
  "type": "text",
  "id": "username",
  "label": "Username",
  "fetchFromAPI": "/api/user-config",
  "value": "admin"
}
```

#### 2. `password`
A password input field (masked input).
- Same properties as `text`.
**Example**:
```json
{
  "type": "password",
  "id": "password",
  "label": "Password",
  "fetchFromAPI": "/api/user-config",
  "value": "secure123"
}
```

#### 3. `number`
A numeric input field with optional range constraints.
- **min**: Optional minimum value.
- **max**: Optional maximum value.
- Other properties same as `text`.
**Example**:
```json
{
  "type": "number",
  "id": "temperature",
  "label": "Set Temperature (°C)",
  "fetchFromAPI": "/api/thermostat",
  "value": 22,
  "min": 15,
  "max": 30
}
```

#### 4. `textarea`
A multi-line text input field.
- Same properties as `text`.
**Example**:
```json
{
  "type": "textarea",
  "id": "notes",
  "label": "Notes",
  "fetchFromAPI": "/api/notes",
  "value": "No notes available."
}
```

#### 5. `select`
A dropdown menu for selecting a single option.
- **options**: Array of options, each with `value` and `text`.
- Other properties same as `text`.
**Example**:
```json
{
  "type": "select",
  "id": "mode",
  "label": "Mode",
  "options": [
    { "value": "cool", "text": "Cool" },
    { "value": "heat", "text": "Heat" },
    { "value": "auto", "text": "Auto" }
  ],
  "fetchFromAPI": "/api/settings",
  "value": "auto"
}
```

#### 6. `checkbox`
A checkbox input for boolean values.
- **checked**: Optional, default state of the checkbox (`true` or `false`).
- Other properties same as `text`.
**Example**:
```json
{
  "type": "checkbox",
  "id": "enable-feature",
  "label": "Enable Feature",
  "fetchFromAPI": "/api/settings",
  "checked": false
}
```

#### 7. `radio`
A group of radio buttons for selecting one option from a set.
- **options**: Array of options, each with `value`, `text`, and optional `checked`.
- Other properties same as `text`.
**Example**:
```json
{
  "type": "radio",
  "id": "fan-speed",
  "label": "Fan Speed",
  "options": [
    { "value": "low", "text": "Low", "checked": true },
    { "value": "medium", "text": "Medium" },
    { "value": "high", "text": "High" }
  ],
  "fetchFromAPI": "/api/settings"
}
```

#### 8. `file`
A file input field for uploading files.
- **accept**: Optional, specifies accepted file types (e.g., `image/*`).
- Other properties same as `text`.
**Example**:
```json
{
  "type": "file",
  "id": "upload-file",
  "label": "Upload File",
  "accept": "image/*"
}
```

#### 9. `button`
A button that triggers an action via an API.
- **label**: Button text.
- **action**: API endpoint to trigger (POST request) when clicked.
**Example**:
```json
{
  "type": "button",
  "id": "save-settings",
  "label": "Save Settings",
  "action": "/api/save-settings"
}
```
When clicked, the button sends a POST request with the current values of all input elements in the same subtab.

#### 10. `statusLed`
A status LED indicator (green for `true`, red for `false`).
- **label**: Label for the LED.
- **fetchFromAPI**: API endpoint to fetch the status (expects a boolean value).
**Example**:
```json
{
  "type": "statusLed",
  "id": "connection-status",
  "label": "Connection Status",
  "fetchFromAPI": "/api/status"
}
```

#### 11. `label`
A static text label for displaying information.
- **text**: The text to display.
**Example**:
```json
{
  "type": "label",
  "id": "welcome-message",
  "text": "Welcome to the System!"
}
```

#### 12. `categoryDiv`
A container to group related items under a title.
- **title**: Title of the category.
- **items**: Array of child items.
- **align**: Optional. Can be set to only 'horizontal'.
- **fetchFromAPI**: Optional API to fetch data for child items.
**Example**:
```json
{
  "type": "categoryDiv",
  "id": "system-stats",
  "title": "System Stats",
  "align": "horizontal",
  "fetchFromAPI": "/api/stats",
  "items": [
    { "type": "textValue", "id": "uptime", "text": "Uptime (minutes)" },
    { "type": "statusLed", "id": "status", "label": "System Status" }
  ]
}
```

#### 13. `customList`
A table-like list with editable fields for each row.
- **label**: Title of the list.
- **fields**: Array of field definitions (supports `text`, `checkbox`, `number`, `select`).
- **fetchFromAPI**: API endpoint to fetch list data (expects an array).
**Example**:
```json
{
  "type": "customList",
  "id": "user-list",
  "label": "Users",
  "fetchFromAPI": "/api/users",
  "fields": [
    { "type": "text", "id": "username", "label": "Username", "readonly": true },
    { "type": "checkbox", "id": "is-active", "label": "Active" }
  ]
}
```

#### 14. `listItem`
A dynamic list where users can add or edit items.
- **label**: Title of the list.
- **items**: Array of initial items, each with `label` and `value`.
- **addButtonLabel**: Text for the "Add" button.
**Example**:
```json
{
  "type": "listItem",
  "id": "task-list",
  "label": "Tasks",
  "items": [
    { "label": "Task 1", "value": "Do something" },
    { "label": "Task 2", "value": "Do another thing" }
  ],
  "addButtonLabel": "Add Task"
}
```

#### 15. `fileReader`
Displays the content of a file fetched from an API in a read-only textarea.
- **fetchFromAPI**: API endpoint to fetch the file content (expects plain text).
**Example**:
```json
{
  "type": "fileReader",
  "id": "logs",
  "fetchFromAPI": "/api/logs"
}
```

#### 16. `customHTML`
Embeds a custom HTML template with dynamic data from APIs.
- **source**: Path to the HTML file (relative to the root directory).
- **apis**: Array of API endpoints to fetch data (only GET methods supported).
**Example**:
```json
{
  "type": "customHTML",
  "id": "overview",
  "source": "custom-overview",
  "apis": [
    { "id": "status", "endpoint": "/api/status", "method": "GET" }
  ]
}
```
The HTML template can contain placeholders (e.g., `${variable}`) that will be replaced with API data.

#### 17. `logFile`
Displays the content of a log file with ANSI color.
- **fetchFromAPI**: API endpoint to fetch the log file content.
**Example**:
```json
{
  "type": "logFile",
  "id": "logReader",
  "fetchFromAPI": "/api/readfile/var/log/app"
}
```

## Custom CSS
You can use your additional custom CSS file by simply adding it to `css/custom.css` file.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the GNU License. See the `LICENSE` file for details.