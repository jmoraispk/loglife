"""Tests for audio_journal_entries database operations."""

from app.db.operations import audio_journal_entries, users


def test_create_audio_journal_entry() -> None:
    """Test creating a new audio journal entry.

    Verifies successful entry creation with transcription and summary texts,
    ensures entries are properly associated with users, and validates that
    multiple entries can be created for the same user.

    """
    # Arrange - create a user
    user = users.create_user("+1234567890", "America/New_York")

    # Test successful creation
    audio_journal_entries.create_audio_journal_entry(
        user_id=user["id"],
        transcription_text="Today I practiced Python for 2 hours",
        summary_text="Practiced Python for 2 hours",
    )

    # Verify entry was created by retrieving user's entries
    entries = audio_journal_entries.get_user_audio_journal_entries(user["id"])
    assert len(entries) == 1
    assert entries[0]["user_id"] == user["id"]
    assert entries[0]["transcription_text"] == "Today I practiced Python for 2 hours"
    assert entries[0]["summary_text"] == "Practiced Python for 2 hours"

    # Test creating another entry
    audio_journal_entries.create_audio_journal_entry(
        user_id=user["id"],
        transcription_text="Exercised for 30 minutes this morning",
        summary_text="Morning exercise - 30 min",
    )

    # Verify both entries exist
    entries = audio_journal_entries.get_user_audio_journal_entries(user["id"])
    assert len(entries) == 2


def test_get_audio_journal_entry() -> None:
    """Test retrieving an audio journal entry by its unique ID.

    Verifies that existing entries can be successfully retrieved by ID with
    all expected fields (transcription, summary), while non-existent entry
    IDs properly return None.

    """
    # Arrange - create user and entry
    user = users.create_user("+1234567890", "America/New_York")
    audio_journal_entries.create_audio_journal_entry(
        user_id=user["id"],
        transcription_text="Today I practiced Python",
        summary_text="Practiced Python",
    )

    # Get the entry ID
    entries = audio_journal_entries.get_user_audio_journal_entries(user["id"])
    entry_id = entries[0]["id"]

    # Test retrieving existing entry
    retrieved_entry = audio_journal_entries.get_audio_journal_entry(entry_id)

    # Assert existing entry
    assert retrieved_entry is not None
    assert isinstance(retrieved_entry, dict)
    assert retrieved_entry["id"] == entry_id
    assert retrieved_entry["user_id"] == user["id"]
    assert retrieved_entry["transcription_text"] == "Today I practiced Python"
    assert retrieved_entry["summary_text"] == "Practiced Python"

    # Test retrieving non-existent entry
    non_existent_entry = audio_journal_entries.get_audio_journal_entry(999)
    assert non_existent_entry is None


def test_get_user_audio_journal_entries() -> None:
    """Test retrieving all journal entries for a specific user.

    Verifies that all entries belonging to a user are returned with complete
    field data, entries from different users are properly isolated, and users
    with no entries return an empty list.

    """
    # Arrange - create users and entries
    user1 = users.create_user("+1234567890", "America/New_York")
    user2 = users.create_user("+9876543210", "Europe/London")

    audio_journal_entries.create_audio_journal_entry(
        user_id=user1["id"],
        transcription_text="Entry 1 for user 1",
        summary_text="Summary 1",
    )
    audio_journal_entries.create_audio_journal_entry(
        user_id=user1["id"],
        transcription_text="Entry 2 for user 1",
        summary_text="Summary 2",
    )
    audio_journal_entries.create_audio_journal_entry(
        user_id=user2["id"],
        transcription_text="Entry 1 for user 2",
        summary_text="Summary for user 2",
    )

    # Test retrieving entries for user1
    user1_entries = audio_journal_entries.get_user_audio_journal_entries(user1["id"])

    # Assert correct count and user
    assert len(user1_entries) == 2
    for entry in user1_entries:
        assert entry["user_id"] == user1["id"]
        assert "id" in entry
        assert "transcription_text" in entry
        assert "summary_text" in entry
        assert "created_at" in entry

    # Test retrieving entries for user2
    user2_entries = audio_journal_entries.get_user_audio_journal_entries(user2["id"])
    assert len(user2_entries) == 1
    assert user2_entries[0]["user_id"] == user2["id"]

    # Test retrieving entries for user with no entries
    user3 = users.create_user("+5555555555", "Asia/Tokyo")
    empty_entries = audio_journal_entries.get_user_audio_journal_entries(user3["id"])
    assert len(empty_entries) == 0


def test_get_all_audio_journal_entries() -> None:
    """Test retrieving all audio journal entries from the database.

    Verifies that all journal entry records across all users are returned
    with complete field data.

    """
    # Arrange - create users and entries
    user1 = users.create_user("+1234567890", "America/New_York")
    user2 = users.create_user("+9876543210", "Europe/London")

    audio_journal_entries.create_audio_journal_entry(
        user_id=user1["id"],
        transcription_text="Entry 1",
        summary_text="Summary 1",
    )
    audio_journal_entries.create_audio_journal_entry(
        user_id=user1["id"],
        transcription_text="Entry 2",
        summary_text="Summary 2",
    )
    audio_journal_entries.create_audio_journal_entry(
        user_id=user2["id"],
        transcription_text="Entry 3",
        summary_text="Summary 3",
    )

    # Act
    all_entries = audio_journal_entries.get_all_audio_journal_entries()

    # Assert correct count
    assert len(all_entries) == 3

    # Verify all entries have required fields
    for entry in all_entries:
        assert "id" in entry
        assert "user_id" in entry
        assert "transcription_text" in entry
        assert "summary_text" in entry
        assert "created_at" in entry


def test_update_audio_journal_entry() -> None:
    """Test updating an audio journal entry.

    Verifies that an entry can be successfully updated.
    """
    # Arrange - create user and entry
    user = users.create_user("+1234567890", "America/New_York")
    audio_journal_entries.create_audio_journal_entry(
        user_id=user["id"],
        transcription_text="Old text",
        summary_text="Old summary",
    )
    entries = audio_journal_entries.get_user_audio_journal_entries(user["id"])
    entry_id = entries[0]["id"]

    # Act - update the entry
    audio_journal_entries.update_audio_journal_entry(
        entry_id=entry_id,
        transcription_text="New text",
        summary_text="New summary",
    )

    # Assert entry is updated
    updated_entry = audio_journal_entries.get_audio_journal_entry(entry_id)
    assert updated_entry["transcription_text"] == "New text"
    assert updated_entry["summary_text"] == "New summary"


def test_delete_audio_journal_entry() -> None:
    """Test deleting an audio journal entry from the database.

    Verifies that an entry can be successfully deleted by ID, subsequent
    attempts to retrieve the deleted entry return None, and the user's
    entry list is properly updated.

    """
    # Arrange - create user and entry
    user = users.create_user("+1234567890", "America/New_York")
    audio_journal_entries.create_audio_journal_entry(
        user_id=user["id"],
        transcription_text="Test entry",
        summary_text="Test summary",
    )

    # Get the entry ID
    entries = audio_journal_entries.get_user_audio_journal_entries(user["id"])
    entry_id = entries[0]["id"]

    # Verify entry exists
    assert audio_journal_entries.get_audio_journal_entry(entry_id) is not None

    # Act - delete the entry
    audio_journal_entries.delete_audio_journal_entry(entry_id)

    # Assert entry is deleted
    deleted_entry = audio_journal_entries.get_audio_journal_entry(entry_id)
    assert deleted_entry is None

    # Verify user has no entries
    user_entries = audio_journal_entries.get_user_audio_journal_entries(user["id"])
    assert len(user_entries) == 0
