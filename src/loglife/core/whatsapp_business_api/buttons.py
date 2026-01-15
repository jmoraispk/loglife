"""Button-related classes for WhatsApp Business API interactive messages."""

from dataclasses import dataclass

MAX_BUTTON_ID_LENGTH = 256
MAX_BUTTON_TITLE_LENGTH = 20
MAX_LIST_ROW_TITLE_LENGTH = 24
MAX_LIST_ROW_DESCRIPTION_LENGTH = 72
MAX_LIST_SECTION_TITLE_LENGTH = 24


@dataclass(frozen=True)
class ReplyButton:
    """Reply button definition."""

    id: str
    title: str

    def __post_init__(self) -> None:
        """Validate button parameters."""
        if len(self.id) > MAX_BUTTON_ID_LENGTH:
            msg = f"Button ID must not exceed {MAX_BUTTON_ID_LENGTH} characters"
            raise ValueError(msg)
        if len(self.title) > MAX_BUTTON_TITLE_LENGTH:
            msg = f"Button title must not exceed {MAX_BUTTON_TITLE_LENGTH} characters"
            raise ValueError(msg)


@dataclass(frozen=True)
class ListRow:
    """List row definition for interactive list messages."""

    id: str
    title: str
    description: str | None = None

    def __post_init__(self) -> None:
        """Validate list row parameters."""
        if len(self.id) > MAX_BUTTON_ID_LENGTH:
            msg = f"Row ID must not exceed {MAX_BUTTON_ID_LENGTH} characters"
            raise ValueError(msg)
        if len(self.title) > MAX_LIST_ROW_TITLE_LENGTH:
            msg = f"Row title must not exceed {MAX_LIST_ROW_TITLE_LENGTH} characters"
            raise ValueError(msg)
        if self.description and len(self.description) > MAX_LIST_ROW_DESCRIPTION_LENGTH:
            msg = f"Row description must not exceed {MAX_LIST_ROW_DESCRIPTION_LENGTH} characters"
            raise ValueError(msg)


@dataclass(frozen=True)
class ListSection:
    """List section definition for interactive list messages."""

    title: str
    rows: list[ListRow]

    def __post_init__(self) -> None:
        """Validate list section parameters."""
        if len(self.title) > MAX_LIST_SECTION_TITLE_LENGTH:
            msg = f"Section title must not exceed {MAX_LIST_SECTION_TITLE_LENGTH} characters"
            raise ValueError(msg)
        if not self.rows:
            msg = "Section must have at least one row"
            raise ValueError(msg)


@dataclass(frozen=True)
class URLButton:
    """URL button definition for interactive messages."""

    display_text: str
    url: str

    def __post_init__(self) -> None:
        """Validate URL button parameters."""
        if len(self.display_text) > MAX_BUTTON_TITLE_LENGTH:
            msg = f"Display text must not exceed {MAX_BUTTON_TITLE_LENGTH} characters"
            raise ValueError(msg)
        if not self.url:
            msg = "URL is required"
            raise ValueError(msg)
