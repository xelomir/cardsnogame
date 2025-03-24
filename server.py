from flask import Flask, request, send_from_directory, jsonify
import os
from datetime import datetime

app = Flask(__name__, static_folder='card-battle-game/dist')

# Dictionary to store user statistics
user_stats = {}

@app.route('/')
def index():
    user_id = request.args.get('user_id', 'default')
    # Initialize user stats if not exists
    if user_id not in user_stats:
        user_stats[user_id] = {
            'gamesPlayed': 0,
            'gamesWon': 0,
            'gamesLost': 0,
            'totalDamageDealt': 0,
            'totalCardsPlayed': 0,
            'totalTurns': 0,
            'lastPlayed': datetime.now().isoformat(),
            'favoriteCards': {}
        }
    # Serve the index.html file
    return send_from_directory(app.static_folder, 'index.html')

# Route to serve static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# API endpoint to save game statistics
@app.route('/api/save-stats', methods=['POST'])
def save_stats():
    user_id = request.args.get('user_id', 'default')
    stats = request.json

    if user_id in user_stats:
        user_stats[user_id].update(stats)
        user_stats[user_id]['lastPlayed'] = datetime.now().isoformat()
    else:
        stats['lastPlayed'] = datetime.now().isoformat()
        user_stats[user_id] = stats

    return jsonify({"success": True})

# API endpoint to get user statistics
@app.route('/api/get-stats', methods=['GET'])
def get_stats():
    user_id = request.args.get('user_id', 'default')

    if user_id in user_stats:
        return jsonify(user_stats[user_id])
    else:
        # Return default stats if user does not exist
        default_stats = {
            'gamesPlayed': 0,
            'gamesWon': 0,
            'gamesLost': 0,
            'totalDamageDealt': 0,
            'totalCardsPlayed': 0,
            'totalTurns': 0,
            'lastPlayed': datetime.now().isoformat(),
            'favoriteCards': {}
        }
        user_stats[user_id] = default_stats
        return jsonify(default_stats)

if __name__ == '__main__':
    # Ensure the app runs on 0.0.0.0 to be accessible externally
    app.run(host='0.0.0.0', port=5000, debug=True)
