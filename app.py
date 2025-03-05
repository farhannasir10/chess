import os
from flask import Flask, render_template, jsonify, send_from_directory
import json
import logging
import pathlib

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")  # Fallback for development

# Get the absolute path to puzzles.json
PUZZLES_PATH = os.path.join(pathlib.Path(__file__).parent.absolute(), 'puzzles.json')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/puzzles')
def get_puzzles():
    try:
        with open(PUZZLES_PATH, 'r') as f:
            puzzles = json.load(f)
        return jsonify(puzzles)
    except Exception as e:
        logging.error(f"Error loading puzzles: {str(e)}")
        return jsonify({"error": "Could not load puzzles"}), 500

# Serve static files in Vercel environment
@app.route('/<path:path>')
def serve_static(path):
    try:
        if path.startswith('static/'):
            return send_from_directory('.', path)
        return app.send_static_file(path)
    except Exception as e:
        logging.error(f"Error serving static file {path}: {str(e)}")
        return jsonify({"error": "Could not serve static file"}), 500

# Vercel requires this
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)