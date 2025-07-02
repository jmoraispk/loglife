from flask import Flask, request
from logic import process_message

app = Flask(__name__)

@app.route("/process", methods=["POST"])
def process():
    data = request.get_json()
    message = data.get("message", "")
    sender = data.get("from", "")
    response = process_message(message, sender)
    return response

if __name__ == "__main__":
    app.run(port=5000, debug=True)
