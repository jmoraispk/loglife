import sys
import re
from app.api.handler import handle_message


PROMPT_RE = re.compile(r"^\+(\d{7,15})>\s*(.*)$")


def main():
    print("Simulator ready. Type '+15551234567> message'")
    for line in sys.stdin:
        line = line.rstrip("\n")
        if not line:
            continue
        m = PROMPT_RE.match(line)
        if not m:
            print("Format: +<phone> > <message>")
            continue
        phone, msg = m.group(1), m.group(2)
        payload = {"from": "+" + phone, "text": msg, "id": None}
        outbound = handle_message(payload)
        print(f"+{phone}< {outbound.text}")


if __name__ == "__main__":
    main()

