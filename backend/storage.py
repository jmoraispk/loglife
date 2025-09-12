import json
import os

JOURNAL_PATH = "journal.json"


def load_user_data(user_id):
    if not os.path.exists(JOURNAL_PATH):
        return {"goals": [], "entries": {}}
    with open(JOURNAL_PATH) as f:
        all_data = json.load(f)
    return all_data.get(user_id, {"goals": [], "entries": {}})


def save_user_data(user_id, data):
    if os.path.exists(JOURNAL_PATH):
        with open(JOURNAL_PATH) as f:
            all_data = json.load(f)
    else:
        all_data = {}
    all_data[user_id] = data
    with open(JOURNAL_PATH, "w") as f:
        json.dump(all_data, f, indent=2)
