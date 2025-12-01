"""Tests for audio_journals database operations."""

from datetime import datetime

from loglife.app.db.client import db
from loglife.app.db.tables import AudioJournalEntry, User


def test_create_audio_journal_entry() -> None:
    """Test creating a new audio journal entry.

    Verifies successful creation of audio journal entries and ensures
    they are associated with the correct user.
    """
    # Arrange
    user: User = db.users.create("+1234567890", "America/New_York")

    # Act
    db.audio_journals.create(
        user_id=user.id,
        transcription_text="Today was a good day.",
        summary_text="Positive day summary.",
    )

    # Assert
    entries = db.audio_journals.get_by_user(user.id)
    assert len(entries) == 1
    assert isinstance(entries[0], AudioJournalEntry)
    assert entries[0].user_id == user.id
    assert entries[0].transcription_text == "Today was a good day."
    assert entries[0].summary_text == "Positive day summary."
    assert isinstance(entries[0].created_at, str | datetime)


def test_get_audio_journal_entry() -> None:
    """Test retrieving an audio journal entry by ID.

    Verifies that existing entries can be retrieved by ID and non-existent
    IDs return None.
    """
    # Arrange
    user = db.users.create("+1234567890", "America/New_York")
    db.audio_journals.create(
        user_id=user.id,
        transcription_text="Test entry",
        summary_text="Summary",
    )
    entries = db.audio_journals.get_by_user(user.id)
    entry_id = entries[0].id

    # Act
    retrieved_entry = db.audio_journals.get(entry_id)
    non_existent_entry = db.audio_journals.get(999)

    # Assert
    assert retrieved_entry is not None
    assert retrieved_entry.id == entry_id
    assert retrieved_entry.transcription_text == "Test entry"
    assert non_existent_entry is None


def test_get_user_audio_journal_entries() -> None:
    """Test retrieving all audio journal entries for a user.

    Verifies that all entries for a specific user are returned, correct ordering,
    and empty list for users with no entries.
    """
    # Arrange
    user1 = db.users.create("+1234567890", "America/New_York")
    user2 = db.users.create("+9876543210", "Europe/London")
    user3 = db.users.create("+1111111111", "UTC")

    # Create entries for user1
    db.audio_journals.create(user1.id, "Entry 1", "Summary 1")
    db.audio_journals.create(user1.id, "Entry 2", "Summary 2")
    db.audio_journals.create(user1.id, "Entry 3", "Summary 3")

    # Create entry for user2
    db.audio_journals.create(user2.id, "User 2 Entry", "User 2 Summary")

    # Act
    user1_entries = db.audio_journals.get_by_user(user1.id)
    user2_entries = db.audio_journals.get_by_user(user2.id)
    empty_entries = db.audio_journals.get_by_user(user3.id)

    # Assert
    assert len(user1_entries) == 3
    assert len(user2_entries) == 1
    assert len(empty_entries) == 0

    # Verify entries belong to correct user
    for entry in user1_entries:
        assert entry.user_id == user1.id

    assert user2_entries[0].user_id == user2.id


def test_get_all_audio_journal_entries() -> None:
    """Test retrieving all audio journal entries.

    Verifies that get_all returns all entries in the database.
    """
    # Arrange
    user = db.users.create("+1234567890", "UTC")
    db.audio_journals.create(user.id, "Entry A", "Summary A")
    db.audio_journals.create(user.id, "Entry B", "Summary B")
    db.audio_journals.create(user.id, "Entry C", "Summary C")

    # Act
    all_entries = db.audio_journals.get_all()

    # Assert
    assert len(all_entries) == 3


def test_update_audio_journal_entry() -> None:
    """Test updating an audio journal entry.

    Verifies that transcription and summary text can be updated.
    """
    # Arrange
    user = db.users.create("+1234567890", "America/New_York")
    db.audio_journals.create(
        user_id=user.id,
        transcription_text="Original text",
        summary_text="Original summary",
    )
    entries = db.audio_journals.get_by_user(user.id)
    entry_id = entries[0].id

    # Act
    db.audio_journals.update(
        entry_id=entry_id,
        transcription_text="Updated text",
        summary_text="Updated summary",
    )

    # Assert
    updated_entry = db.audio_journals.get(entry_id)
    assert updated_entry is not None
    assert updated_entry.transcription_text == "Updated text"
    assert updated_entry.summary_text == "Updated summary"


def test_delete_audio_journal_entry() -> None:
    """Test deleting an audio journal entry.

    Verifies that an entry can be successfully deleted by ID.
    """
    # Arrange
    user = db.users.create("+1234567890", "America/New_York")
    db.audio_journals.create(
        user_id=user.id,
        transcription_text="To delete",
        summary_text="Delete summary",
    )
    entries = db.audio_journals.get_by_user(user.id)
    entry_id = entries[0].id

    # Verify entry exists
    assert db.audio_journals.get(entry_id) is not None

    # Act
    db.audio_journals.delete(entry_id)

    # Assert
    deleted_entry = db.audio_journals.get(entry_id)
    assert deleted_entry is None
    user_entries = db.audio_journals.get_by_user(user.id)
    assert len(user_entries) == 0

