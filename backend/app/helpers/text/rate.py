

def is_valid_rating_digits(message: str) -> bool:
    return message.isdigit() and all(m in "123" for m in message)
