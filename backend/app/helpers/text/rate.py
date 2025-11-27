"""Rating helper utilities."""


def is_valid_rating_digits(message: str) -> bool:
    """Checks whether the message contains only valid rating digits.

    Arguments:
    message -- The text to validate

    Returns True if every character is 1, 2, or 3; otherwise False.

    """
    return message.isdigit() and all(m in "123" for m in message)
