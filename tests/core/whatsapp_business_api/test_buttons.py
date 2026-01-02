"""Tests for button validation classes."""

import pytest

from loglife.core.whatsapp_business_api.buttons import (
    ListRow,
    ListSection,
    ReplyButton,
    URLButton,
    VoiceCallButton,
)


def test_reply_button_valid() -> None:
    """Test ReplyButton with valid parameters."""
    button = ReplyButton(id="test_id", title="Test")
    assert button.id == "test_id"
    assert button.title == "Test"


def test_reply_button_id_too_long() -> None:
    """Test ReplyButton with ID exceeding max length."""
    long_id = "a" * 257  # MAX_BUTTON_ID_LENGTH is 256
    with pytest.raises(ValueError, match="Button ID must not exceed"):
        ReplyButton(id=long_id, title="Test")


def test_reply_button_title_too_long() -> None:
    """Test ReplyButton with title exceeding max length."""
    long_title = "a" * 21  # MAX_BUTTON_TITLE_LENGTH is 20
    with pytest.raises(ValueError, match="Button title must not exceed"):
        ReplyButton(id="test", title=long_title)


def test_reply_button_exact_max_lengths() -> None:
    """Test ReplyButton with exact max length parameters."""
    max_id = "a" * 256
    max_title = "a" * 20
    button = ReplyButton(id=max_id, title=max_title)
    assert button.id == max_id
    assert button.title == max_title


def test_list_row_valid() -> None:
    """Test ListRow with valid parameters."""
    row = ListRow(id="test_id", title="Test", description="Description")
    assert row.id == "test_id"
    assert row.title == "Test"
    assert row.description == "Description"


def test_list_row_no_description() -> None:
    """Test ListRow without description."""
    row = ListRow(id="test_id", title="Test")
    assert row.id == "test_id"
    assert row.title == "Test"
    assert row.description is None


def test_list_row_id_too_long() -> None:
    """Test ListRow with ID exceeding max length."""
    long_id = "a" * 257
    with pytest.raises(ValueError, match="Row ID must not exceed"):
        ListRow(id=long_id, title="Test")


def test_list_row_title_too_long() -> None:
    """Test ListRow with title exceeding max length."""
    long_title = "a" * 25  # MAX_LIST_ROW_TITLE_LENGTH is 24
    with pytest.raises(ValueError, match="Row title must not exceed"):
        ListRow(id="test", title=long_title)


def test_list_row_description_too_long() -> None:
    """Test ListRow with description exceeding max length."""
    long_description = "a" * 73  # MAX_LIST_ROW_DESCRIPTION_LENGTH is 72
    with pytest.raises(ValueError, match="Row description must not exceed"):
        ListRow(id="test", title="Test", description=long_description)


def test_list_row_exact_max_lengths() -> None:
    """Test ListRow with exact max length parameters."""
    max_id = "a" * 256
    max_title = "a" * 24
    max_description = "a" * 72
    row = ListRow(id=max_id, title=max_title, description=max_description)
    assert row.id == max_id
    assert row.title == max_title
    assert row.description == max_description


def test_list_section_valid() -> None:
    """Test ListSection with valid parameters."""
    rows = [ListRow(id="1", title="Row 1"), ListRow(id="2", title="Row 2")]
    section = ListSection(title="Section", rows=rows)
    assert section.title == "Section"
    assert len(section.rows) == 2


def test_list_section_title_too_long() -> None:
    """Test ListSection with title exceeding max length."""
    long_title = "a" * 25  # MAX_LIST_SECTION_TITLE_LENGTH is 24
    rows = [ListRow(id="1", title="Row 1")]
    with pytest.raises(ValueError, match="Section title must not exceed"):
        ListSection(title=long_title, rows=rows)


def test_list_section_empty_rows() -> None:
    """Test ListSection with empty rows list."""
    with pytest.raises(ValueError, match="Section must have at least one row"):
        ListSection(title="Section", rows=[])


def test_list_section_exact_max_title() -> None:
    """Test ListSection with exact max title length."""
    max_title = "a" * 24
    rows = [ListRow(id="1", title="Row 1")]
    section = ListSection(title=max_title, rows=rows)
    assert section.title == max_title


def test_url_button_valid() -> None:
    """Test URLButton with valid parameters."""
    button = URLButton(display_text="Click", url="https://example.com")
    assert button.display_text == "Click"
    assert button.url == "https://example.com"


def test_url_button_display_text_too_long() -> None:
    """Test URLButton with display text exceeding max length."""
    long_text = "a" * 21  # MAX_BUTTON_TITLE_LENGTH is 20
    with pytest.raises(ValueError, match="Display text must not exceed"):
        URLButton(display_text=long_text, url="https://example.com")


def test_url_button_empty_url() -> None:
    """Test URLButton with empty URL."""
    with pytest.raises(ValueError, match="URL is required"):
        URLButton(display_text="Click", url="")


def test_url_button_exact_max_display_text() -> None:
    """Test URLButton with exact max display text length."""
    max_text = "a" * 20
    button = URLButton(display_text=max_text, url="https://example.com")
    assert button.display_text == max_text


def test_voice_call_button_valid() -> None:
    """Test VoiceCallButton with valid parameters."""
    button = VoiceCallButton(display_text="Call", ttl_minutes=5, payload="test_payload")
    assert button.display_text == "Call"
    assert button.ttl_minutes == 5
    assert button.payload == "test_payload"


def test_voice_call_button_display_text_too_long() -> None:
    """Test VoiceCallButton with display text exceeding max length."""
    long_text = "a" * 21  # MAX_BUTTON_TITLE_LENGTH is 20
    with pytest.raises(ValueError, match="Display text must not exceed"):
        VoiceCallButton(display_text=long_text, ttl_minutes=5, payload="test")


def test_voice_call_button_empty_display_text() -> None:
    """Test VoiceCallButton with empty display text."""
    with pytest.raises(ValueError, match="Display text is required"):
        VoiceCallButton(display_text="", ttl_minutes=5, payload="test")


def test_voice_call_button_zero_ttl() -> None:
    """Test VoiceCallButton with zero TTL."""
    with pytest.raises(ValueError, match="TTL minutes must be greater than 0"):
        VoiceCallButton(display_text="Call", ttl_minutes=0, payload="test")


def test_voice_call_button_negative_ttl() -> None:
    """Test VoiceCallButton with negative TTL."""
    with pytest.raises(ValueError, match="TTL minutes must be greater than 0"):
        VoiceCallButton(display_text="Call", ttl_minutes=-1, payload="test")


def test_voice_call_button_exact_max_display_text() -> None:
    """Test VoiceCallButton with exact max display text length."""
    max_text = "a" * 20
    button = VoiceCallButton(display_text=max_text, ttl_minutes=5, payload="test")
    assert button.display_text == max_text


def test_voice_call_button_valid_ttl() -> None:
    """Test VoiceCallButton with valid TTL values."""
    button1 = VoiceCallButton(display_text="Call", ttl_minutes=1, payload="test")
    assert button1.ttl_minutes == 1

    button2 = VoiceCallButton(display_text="Call", ttl_minutes=60, payload="test")
    assert button2.ttl_minutes == 60
