from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from livekit import AccessToken, VideoGrant
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Firebase
cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))
firebase_admin.initialize_app(cred)
db = firestore.client()

# Flask app setup
app = Flask(__name__)
CORS(app)

@app.route('/get_config', methods=['GET'])
def get_config():
    return jsonify({'livekit_url': os.getenv('LIVEKIT_URL')}), 200

@app.route('/get_token', methods=['GET'])
def get_token():
    room_name = request.args.get('room')
    participant_name = request.args.get('name')
    if not room_name or not participant_name:
        return jsonify({"error": "Missing parameters"}), 400

    at = AccessToken(os.getenv('LIVEKIT_API_KEY'), os.getenv('LIVEKIT_API_SECRET'), identity=participant_name)
    grant = VideoGrant(room_join=True, room=room_name)
    at.grant = grant
    return jsonify({'token': at.to_jwt()}), 200

@app.route('/ai_respond', methods=['POST'])
def ai_respond():
    data = request.json
    question = data.get("question")

    kb = db.collection("knowledge_base").where("question", "==", question).get()
    if kb:
        return jsonify({"answer": kb[0].to_dict()["answer"]})
    else:
        request_id = str(uuid.uuid4())
        db.collection("help_requests").document(request_id).set({
            "question": question,
            "status": "pending",
            "created_at": datetime.utcnow()
        })
        print(f"[SUPERVISOR ALERT] Help needed for question: {question}")
        return jsonify({"answer": "Let me check with my supervisor and get back to you.", "request_id": request_id})

@app.route('/supervisor/requests', methods=['GET'])
def list_requests():
    docs = db.collection("help_requests").where("status", "==", "pending").stream()
    return jsonify([{**doc.to_dict(), "id": doc.id} for doc in docs])

@app.route('/supervisor/respond', methods=['POST'])
def respond():
    data = request.json
    request_id = data["request_id"]
    answer = data["answer"]
    ref = db.collection("help_requests").document(request_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Request not found"}), 404
    question = doc.to_dict()["question"]
    ref.update({"status": "resolved", "answered_at": datetime.utcnow()})
    db.collection("knowledge_base").add({"question": question, "answer": answer})
    print(f"[CALLBACK] AI should text the caller back with answer: {answer}")
    return jsonify({"status": "success"})

@app.route('/knowledge_base', methods=['GET'])
def get_kb():
    docs = db.collection("knowledge_base").stream()
    return jsonify([{**doc.to_dict()} for doc in docs])

if __name__ == '__main__':
    app.run(debug=True)
