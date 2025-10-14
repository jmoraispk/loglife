from flask import Flask, request
from app.logic.process_message import process_message
from app.db.sqlite import get_db, close_db, init_db

app = Flask(__name__)

@app.teardown_appcontext
def close_db_connection(exception):
    close_db(exception)

with app.app_context():
    init_db()

@app.route("/process", methods=["POST"])
def process():
    data = request.get_json()
    message = data.get("message", "")
    sender = data.get("from", "")
    response = process_message(message, sender)
    return response

if __name__ == "__main__":
    app.run(port=5000, debug=True)