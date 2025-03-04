import os
from flask import Flask, render_template, jsonify
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/puzzles')
def get_puzzles():
    with open('puzzles.json', 'r') as f:
        puzzles = json.load(f)
    return jsonify(puzzles)

# Vercel requires this
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)