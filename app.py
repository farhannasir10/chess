import os
from flask import Flask, render_template, jsonify
import json
import logging
import pathlib

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Get the absolute path to puzzles.json
PUZZLES_PATH = os.path.join(pathlib.Path(__file__).parent.absolute(), 'puzzles.json')

@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering index: {str(e)}")
        return jsonify({"error": "Could not render index page"}), 500

@app.route('/puzzles')
def get_puzzles():
    try:
        with open(PUZZLES_PATH, 'r') as f:
            puzzles = json.load(f)
        return jsonify(puzzles)
    except Exception as e:
        logger.error(f"Error loading puzzles: {str(e)}")
        return jsonify({"error": "Could not load puzzles"}), 500

# WSGI entry point for Vercel
app = app

if __name__ == '__main__':
    # ALWAYS serve the app on port 5000
    app.run(host='0.0.0.0', port=5000)