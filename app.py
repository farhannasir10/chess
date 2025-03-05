import os
from flask import Flask, render_template, jsonify
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

# Vercel requires this
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)