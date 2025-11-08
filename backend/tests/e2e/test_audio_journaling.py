"""End-to-end tests for audio journaling functionality.

This module contains tests for the complete audio processing pipeline,
including transcription, summarization, database storage, and error handling.
"""
import base64
from typing import Any
from unittest.mock import Mock, patch, MagicMock
import pytest

from app.logic.process_audio import process_audio
from app.logic.helpers.transcribe_audio import transcribe_audio
from app.logic.helpers.summarize_transcript import summarize_transcript
from app.db.data_access.audio_journal import create_audio_journal_entry
from app.db.sqlite import get_db


# ============================================================================
# Helper Functions
# ============================================================================

def create_sample_audio_data() -> dict[str, Any]:
    """Create a sample audio data payload for testing.
    
    Returns:
        dict: Audio data with base64 encoded sample audio
    """
    # Create a simple base64 encoded string representing audio
    sample_audio = b"fake_audio_data_for_testing"
    encoded_audio = base64.b64encode(sample_audio).decode('utf-8')
    
    return {
        "mimetype": "audio/ogg",
        "filename": None,
        "data": encoded_audio,
        "filesize": len(sample_audio),
        "duration": 15,
        "isVoiceNote": True
    }


# ============================================================================
# Audio Processing Integration Tests
# ============================================================================

@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
@patch('app.logic.process_audio.summarize_transcript')
def test_process_audio_complete_workflow(
    mock_summarize: Mock,
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test complete audio processing workflow from start to finish.
    
    Verifies that:
    - Status messages are sent at each stage
    - Transcription is called correctly
    - Summarization is called with transcript
    - Database entry is created
    - Final summary is returned
    """
    # Setup
    user_phone = "923001234567"
    audio_data = create_sample_audio_data()
    
    mock_transcribe.return_value = {"text": "This is the transcribed text from the audio."}
    mock_summarize.return_value = "This is a summary of the audio."
    
    # Execute
    result = process_audio(user_phone, audio_data)
    
    # Verify status messages were sent
    assert mock_send_msg.call_count == 3
    mock_send_msg.assert_any_call(user_phone, "Audio received. Transcribing...")
    mock_send_msg.assert_any_call(user_phone, "Audio transcribed. Summarizing...")
    mock_send_msg.assert_any_call(user_phone, "Summary stored in Database.")
    
    # Verify transcription was called
    mock_transcribe.assert_called_once_with(audio_data)
    
    # Verify summarization was called with transcript
    mock_summarize.assert_called_once_with("This is the transcribed text from the audio.")
    
    # Verify result contains summary
    assert "Summary:" in result
    assert "This is a summary of the audio." in result
    
    # Verify database entry was created
    db = get_db()
    cursor = db.execute(
        "SELECT * FROM audio_journal_entries WHERE user_id = (SELECT id FROM user WHERE phone = ?)",
        (user_phone,)
    )
    entry = cursor.fetchone()
    assert entry is not None
    assert entry['transcription_text'] == "This is the transcribed text from the audio."
    assert entry['summary_text'] == "This is a summary of the audio."


@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
def test_process_audio_empty_transcript(
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test handling of empty transcript from transcription service.
    
    Verifies that:
    - Empty transcript is detected
    - Appropriate error message is sent
    - Processing stops gracefully
    """
    # Setup
    user_phone = "923001234568"
    audio_data = create_sample_audio_data()
    
    mock_transcribe.return_value = {"text": ""}
    
    # Execute
    result = process_audio(user_phone, audio_data)
    
    # Verify error handling
    assert result == "Transcription completed, but no text was returned."
    mock_send_msg.assert_any_call(user_phone, "Transcription completed, but no text was returned.")


@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
def test_process_audio_transcription_failure(
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test handling of transcription service failure.
    
    Verifies that:
    - Exceptions are caught
    - Error message is sent to user
    - Graceful failure response is returned
    """
    # Setup
    user_phone = "923001234569"
    audio_data = create_sample_audio_data()
    
    mock_transcribe.side_effect = Exception("AssemblyAI API error")
    
    # Execute
    result = process_audio(user_phone, audio_data)
    
    # Verify error handling
    assert result == "Audio processing failed."
    mock_send_msg.assert_any_call(user_phone, "Sorry, something went wrong while processing your audio.")


@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
@patch('app.logic.process_audio.summarize_transcript')
def test_process_audio_summarization_failure(
    mock_summarize: Mock,
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test handling of summarization service failure.
    
    Verifies that:
    - Exceptions from OpenAI are caught
    - Error message is sent to user
    - Graceful failure response is returned
    """
    # Setup
    user_phone = "923001234570"
    audio_data = create_sample_audio_data()
    
    mock_transcribe.return_value = {"text": "This is the transcribed text."}
    mock_summarize.side_effect = Exception("OpenAI API error")
    
    # Execute
    result = process_audio(user_phone, audio_data)
    
    # Verify error handling
    assert result == "Audio processing failed."
    mock_send_msg.assert_any_call(user_phone, "Sorry, something went wrong while processing your audio.")


# ============================================================================
# Transcription Helper Tests
# ============================================================================

@patch('app.logic.helpers.transcribe_audio.requests.post')
@patch('app.logic.helpers.transcribe_audio.requests.get')
def test_transcribe_audio_successful(mock_get: Mock, mock_post: Mock) -> None:
    """Test successful audio transcription workflow.
    
    Verifies:
    - Audio upload to AssemblyAI
    - Transcript job creation
    - Polling until completion
    - Return of transcript text
    """
    # Setup
    audio_data = create_sample_audio_data()
    
    # Mock upload response
    upload_response = Mock()
    upload_response.json.return_value = {"upload_url": "https://cdn.assemblyai.com/upload/test123"}
    upload_response.raise_for_status = Mock()
    
    # Mock transcript creation response
    transcript_response = Mock()
    transcript_response.json.return_value = {"id": "transcript_123"}
    transcript_response.raise_for_status = Mock()
    
    # Mock polling response (completed immediately)
    poll_response = Mock()
    poll_response.json.return_value = {
        "id": "transcript_123",
        "status": "completed",
        "text": "This is the transcribed audio content."
    }
    poll_response.raise_for_status = Mock()
    
    # Set up mock calls
    mock_post.side_effect = [upload_response, transcript_response]
    mock_get.return_value = poll_response
    
    # Execute
    result = transcribe_audio(audio_data)
    
    # Verify
    assert result["status"] == "completed"
    assert result["text"] == "This is the transcribed audio content."
    assert mock_post.call_count == 2  # Upload + Create transcript
    assert mock_get.call_count >= 1  # At least one poll


@patch('app.logic.helpers.transcribe_audio.requests.post')
@patch('app.logic.helpers.transcribe_audio.requests.get')
@patch('app.logic.helpers.transcribe_audio.time.sleep')  # Mock sleep to speed up test
def test_transcribe_audio_polling_multiple_times(
    mock_sleep: Mock,
    mock_get: Mock,
    mock_post: Mock
) -> None:
    """Test transcription with multiple polling attempts.
    
    Verifies:
    - System polls multiple times until completion
    - Handles 'processing' and 'queued' statuses
    - Eventually returns completed transcript
    """
    # Setup
    audio_data = create_sample_audio_data()
    
    # Mock upload response
    upload_response = Mock()
    upload_response.json.return_value = {"upload_url": "https://cdn.assemblyai.com/upload/test123"}
    upload_response.raise_for_status = Mock()
    
    # Mock transcript creation response
    transcript_response = Mock()
    transcript_response.json.return_value = {"id": "transcript_456"}
    transcript_response.raise_for_status = Mock()
    
    # Mock polling responses: queued -> processing -> completed
    poll_response_queued = Mock()
    poll_response_queued.json.return_value = {"status": "queued"}
    poll_response_queued.raise_for_status = Mock()
    
    poll_response_processing = Mock()
    poll_response_processing.json.return_value = {"status": "processing"}
    poll_response_processing.raise_for_status = Mock()
    
    poll_response_completed = Mock()
    poll_response_completed.json.return_value = {
        "status": "completed",
        "text": "Final transcribed text."
    }
    poll_response_completed.raise_for_status = Mock()
    
    # Set up mock calls
    mock_post.side_effect = [upload_response, transcript_response]
    mock_get.side_effect = [
        poll_response_queued,
        poll_response_processing,
        poll_response_completed
    ]
    
    # Execute
    result = transcribe_audio(audio_data)
    
    # Verify
    assert result["status"] == "completed"
    assert result["text"] == "Final transcribed text."
    assert mock_get.call_count == 3  # Three polls
    assert mock_sleep.call_count == 2  # Sleep between polls


@patch('app.logic.helpers.transcribe_audio.requests.post')
@patch('app.logic.helpers.transcribe_audio.requests.get')
def test_transcribe_audio_error_status(mock_get: Mock, mock_post: Mock) -> None:
    """Test handling of transcription error status.
    
    Verifies:
    - Error status from AssemblyAI is detected
    - RuntimeError is raised with appropriate message
    """
    # Setup
    audio_data = create_sample_audio_data()
    
    # Mock upload response
    upload_response = Mock()
    upload_response.json.return_value = {"upload_url": "https://cdn.assemblyai.com/upload/test123"}
    upload_response.raise_for_status = Mock()
    
    # Mock transcript creation response
    transcript_response = Mock()
    transcript_response.json.return_value = {"id": "transcript_789"}
    transcript_response.raise_for_status = Mock()
    
    # Mock polling response with error
    poll_response = Mock()
    poll_response.json.return_value = {
        "status": "error",
        "error": "Audio file too short"
    }
    poll_response.raise_for_status = Mock()
    
    # Set up mock calls
    mock_post.side_effect = [upload_response, transcript_response]
    mock_get.return_value = poll_response
    
    # Execute and verify exception
    with pytest.raises(RuntimeError) as exc_info:
        transcribe_audio(audio_data)
    
    assert "Transcription failed" in str(exc_info.value)
    assert "Audio file too short" in str(exc_info.value)


# ============================================================================
# Summarization Helper Tests
# ============================================================================

@patch('app.logic.helpers.summarize_transcript.OpenAI')
def test_summarize_transcript_successful(mock_openai_class: Mock) -> None:
    """Test successful transcript summarization.
    
    Verifies:
    - OpenAI client is created
    - Transcript is sent to API
    - Summary text is returned
    """
    # Setup
    transcript = "This is a long transcript that needs to be summarized. It contains multiple sentences and details about various topics."
    
    # Mock OpenAI client and response
    mock_client = MagicMock()
    mock_response = Mock()
    mock_response.output_text = "This is a concise summary."
    mock_client.responses.create.return_value = mock_response
    mock_openai_class.return_value = mock_client
    
    # Execute
    result = summarize_transcript(transcript)
    
    # Verify
    assert result == "This is a concise summary."
    mock_client.responses.create.assert_called_once()
    call_kwargs = mock_client.responses.create.call_args[1]
    assert call_kwargs['model'] == "gpt-5-nano"
    assert call_kwargs['input'] == transcript


@patch('app.logic.helpers.summarize_transcript.os.getenv')
def test_summarize_transcript_missing_api_key(mock_getenv: Mock) -> None:
    """Test handling of missing OpenAI API key.
    
    Verifies:
    - Missing API key is detected
    - RuntimeError is raised with appropriate message
    """
    # Setup
    mock_getenv.return_value = None
    transcript = "This is a test transcript."
    
    # Execute and verify exception
    with pytest.raises(RuntimeError) as exc_info:
        summarize_transcript(transcript)
    
    assert "OPENAI_API_KEY environment variable is not set" in str(exc_info.value)


# ============================================================================
# Database Operations Tests
# ============================================================================

def test_create_audio_journal_entry_new_user() -> None:
    """Test creating audio journal entry for a new user.
    
    Verifies:
    - User is created automatically if not exists
    - Journal entry is stored with correct data
    - Row ID is returned
    """
    # Setup
    user_phone = "923001234571"
    transcription = "This is the transcribed audio content."
    summary = "This is the summary."
    
    # Execute
    entry_id = create_audio_journal_entry(user_phone, transcription, summary)
    
    # Verify
    assert entry_id > 0
    
    db = get_db()
    cursor = db.execute(
        "SELECT * FROM audio_journal_entries WHERE id = ?",
        (entry_id,)
    )
    entry = cursor.fetchone()
    
    assert entry is not None
    assert entry['transcription_text'] == transcription
    assert entry['summary_text'] == summary
    assert entry['user_id'] > 0


def test_create_audio_journal_entry_existing_user() -> None:
    """Test creating audio journal entry for existing user.
    
    Verifies:
    - Existing user is used
    - Multiple entries can be created for same user
    - Each entry is unique
    """
    # Setup
    user_phone = "923001234572"
    
    # Create first entry
    entry_id_1 = create_audio_journal_entry(
        user_phone,
        "First transcription",
        "First summary"
    )
    
    # Create second entry for same user
    entry_id_2 = create_audio_journal_entry(
        user_phone,
        "Second transcription",
        "Second summary"
    )
    
    # Verify
    assert entry_id_1 != entry_id_2
    
    db = get_db()
    cursor = db.execute(
        "SELECT COUNT(*) as count FROM audio_journal_entries WHERE user_id = (SELECT id FROM user WHERE phone = ?)",
        (user_phone,)
    )
    count = cursor.fetchone()['count']
    
    assert count == 2


def test_create_audio_journal_entry_without_summary() -> None:
    """Test creating audio journal entry without summary.
    
    Verifies:
    - Entry can be created with only transcription
    - Summary field is optional
    """
    # Setup
    user_phone = "923001234573"
    transcription = "This is the transcribed audio content."
    
    # Execute
    entry_id = create_audio_journal_entry(user_phone, transcription, None)
    
    # Verify
    assert entry_id > 0
    
    db = get_db()
    cursor = db.execute(
        "SELECT * FROM audio_journal_entries WHERE id = ?",
        (entry_id,)
    )
    entry = cursor.fetchone()
    
    assert entry is not None
    assert entry['transcription_text'] == transcription
    assert entry['summary_text'] is None


def test_audio_journal_entries_have_timestamps() -> None:
    """Test that audio journal entries have created_at timestamps.
    
    Verifies:
    - Timestamp is automatically set
    - Timestamp is in correct format
    """
    # Setup
    user_phone = "923001234574"
    
    # Execute
    entry_id = create_audio_journal_entry(
        user_phone,
        "Test transcription",
        "Test summary"
    )
    
    # Verify
    db = get_db()
    cursor = db.execute(
        "SELECT created_at FROM audio_journal_entries WHERE id = ?",
        (entry_id,)
    )
    entry = cursor.fetchone()
    
    assert entry is not None
    assert entry['created_at'] is not None
    # Timestamp should be in ISO format (YYYY-MM-DD HH:MM:SS)
    assert len(entry['created_at']) >= 19


# ============================================================================
# Integration with Webhook Tests
# ============================================================================

@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
@patch('app.logic.process_audio.summarize_transcript')
def test_audio_message_end_to_end(
    mock_summarize: Mock,
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test complete end-to-end audio message processing.
    
    Simulates the full flow from webhook receiving audio to final response.
    Verifies:
    - Audio data is processed correctly
    - All services are called in order
    - Database entry is created
    - Correct response is returned
    """
    # Setup
    sender = "923001234575"
    audio_data = create_sample_audio_data()
    
    mock_transcribe.return_value = {
        "id": "test_123",
        "status": "completed",
        "text": "I had a productive day today. Completed my workout and finished an important project at work."
    }
    mock_summarize.return_value = "Productive day with workout and project completion."
    
    # Execute
    response = process_audio(sender, audio_data)
    
    # Verify workflow
    assert mock_send_msg.call_count == 3
    assert "Transcribing" in mock_send_msg.call_args_list[0][0][1]
    assert "Summarizing" in mock_send_msg.call_args_list[1][0][1]
    assert "stored in Database" in mock_send_msg.call_args_list[2][0][1]
    
    # Verify response
    assert "Summary:" in response
    assert "Productive day with workout and project completion." in response
    
    # Verify database
    db = get_db()
    cursor = db.execute(
        "SELECT * FROM audio_journal_entries WHERE user_id = (SELECT id FROM user WHERE phone = ?)",
        (sender,)
    )
    entries = cursor.fetchall()
    assert len(entries) > 0
    
    latest_entry = entries[-1]
    assert "productive day" in latest_entry['transcription_text'].lower()
    assert "Productive day with workout and project completion." in latest_entry['summary_text']


@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
@patch('app.logic.process_audio.summarize_transcript')
def test_multiple_audio_messages_same_user(
    mock_summarize: Mock,
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test processing multiple audio messages from same user.
    
    Verifies:
    - Multiple entries can be created
    - Each entry is stored separately
    - All entries are linked to same user
    """
    # Setup
    sender = "923001234576"
    audio_data = create_sample_audio_data()
    
    # First message
    mock_transcribe.return_value = {"text": "First audio message."}
    mock_summarize.return_value = "Summary of first message."
    
    response1 = process_audio(sender, audio_data)
    assert "Summary of first message." in response1
    
    # Second message
    mock_transcribe.return_value = {"text": "Second audio message."}
    mock_summarize.return_value = "Summary of second message."
    
    response2 = process_audio(sender, audio_data)
    assert "Summary of second message." in response2
    
    # Verify database has both entries
    db = get_db()
    cursor = db.execute(
        "SELECT * FROM audio_journal_entries WHERE user_id = (SELECT id FROM user WHERE phone = ?)",
        (sender,)
    )
    entries = cursor.fetchall()
    assert len(entries) == 2
    
    # Verify distinct entries
    transcripts = [entry['transcription_text'] for entry in entries]
    assert "First audio message." in transcripts
    assert "Second audio message." in transcripts


# ============================================================================
# Webhook Endpoint Tests
# ============================================================================

@patch('app.routes.webhook.process_audio')
def test_webhook_routes_audio_message(mock_process_audio: Mock) -> None:
    """Test webhook endpoint correctly routes audio messages.
    
    Verifies:
    - Audio messageType is detected
    - Request is routed to process_audio function
    - Response is returned to caller
    """
    from app.routes.webhook import webhook_bp
    from flask import Flask
    
    # Setup Flask test client
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    client = app.test_client()
    
    # Mock return value
    mock_process_audio.return_value = "Summary:\nTest summary response"
    
    # Create audio payload
    audio_data = create_sample_audio_data()
    payload = {
        "from": "923001234577",
        "message": None,
        "messageType": "ptt",
        "audio": audio_data
    }
    
    # Execute
    response = client.post('/process', json=payload)
    
    # Verify
    assert response.status_code == 200
    assert "Test summary response" in response.get_data(as_text=True)
    mock_process_audio.assert_called_once_with("923001234577", audio_data)


@patch('app.routes.webhook.process_audio')
def test_webhook_routes_audio_file_type(mock_process_audio: Mock) -> None:
    """Test webhook endpoint handles 'audio' messageType.
    
    Verifies:
    - Both 'ptt' and 'audio' types are handled
    - Audio files are processed same as voice notes
    """
    from app.routes.webhook import webhook_bp
    from flask import Flask
    
    # Setup Flask test client
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    client = app.test_client()
    
    # Mock return value
    mock_process_audio.return_value = "Summary:\nAudio file processed"
    
    # Create audio payload with 'audio' type
    audio_data = create_sample_audio_data()
    payload = {
        "from": "923001234578",
        "messageType": "audio",
        "audio": audio_data
    }
    
    # Execute
    response = client.post('/process', json=payload)
    
    # Verify
    assert response.status_code == 200
    assert "Audio file processed" in response.get_data(as_text=True)
    mock_process_audio.assert_called_once()


@patch('app.routes.webhook.process_message')
def test_webhook_routes_text_message(mock_process_message: Mock) -> None:
    """Test webhook endpoint routes text messages correctly.
    
    Verifies:
    - Text messages are not routed to audio processing
    - process_message is called for text
    - Audio processing is not triggered
    """
    from app.routes.webhook import webhook_bp
    from flask import Flask
    
    # Setup Flask test client
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    client = app.test_client()
    
    # Mock return value
    mock_process_message.return_value = "Text message response"
    
    # Create text payload
    payload = {
        "from": "923001234579",
        "message": "goals",
        "messageType": "chat"
    }
    
    # Execute
    response = client.post('/process', json=payload)
    
    # Verify
    assert response.status_code == 200
    assert "Text message response" in response.get_data(as_text=True)
    mock_process_message.assert_called_once_with("goals", "923001234579")


@patch('app.routes.webhook.process_message')
def test_webhook_audio_message_without_audio_data(mock_process_message: Mock) -> None:
    """Test webhook handles audio messageType without audio data.
    
    Verifies:
    - Missing audio data falls back to text processing
    - No error is raised
    """
    from app.routes.webhook import webhook_bp
    from flask import Flask
    
    # Setup Flask test client
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    client = app.test_client()
    
    # Mock return value
    mock_process_message.return_value = "Fallback response"
    
    # Create payload with audio type but no audio data
    payload = {
        "from": "923001234580",
        "messageType": "ptt",
        "audio": None
    }
    
    # Execute
    response = client.post('/process', json=payload)
    
    # Verify - should fallback to text message processing
    assert response.status_code == 200
    mock_process_message.assert_called_once()


# ============================================================================
# Audio Data Validation Tests
# ============================================================================

def test_audio_data_structure() -> None:
    """Test sample audio data has correct structure.
    
    Verifies:
    - All required fields are present
    - Data is base64 encoded
    - Metadata is correct
    """
    audio_data = create_sample_audio_data()
    
    assert 'data' in audio_data
    assert 'mimetype' in audio_data
    assert 'duration' in audio_data
    assert 'isVoiceNote' in audio_data
    
    # Verify base64 encoding
    assert isinstance(audio_data['data'], str)
    
    # Verify can decode
    decoded = base64.b64decode(audio_data['data'])
    assert decoded == b"fake_audio_data_for_testing"


@patch('app.logic.process_audio.send_whatsapp_message')
@patch('app.logic.process_audio.transcribe_audio')
@patch('app.logic.process_audio.summarize_transcript')
def test_process_audio_with_minimal_audio_data(
    mock_summarize: Mock,
    mock_transcribe: Mock,
    mock_send_msg: Mock
) -> None:
    """Test audio processing with minimal required fields.
    
    Verifies:
    - System handles audio data with only required fields
    - Optional fields can be missing
    - Processing completes successfully
    """
    # Setup
    user_phone = "923001234581"
    
    # Minimal audio data (only 'data' field)
    minimal_audio_data = {
        "data": base64.b64encode(b"test_audio").decode('utf-8')
    }
    
    mock_transcribe.return_value = {"text": "Minimal test transcription."}
    mock_summarize.return_value = "Minimal test summary."
    
    # Execute
    result = process_audio(user_phone, minimal_audio_data)
    
    # Verify
    assert "Summary:" in result
    assert "Minimal test summary." in result
    mock_transcribe.assert_called_once_with(minimal_audio_data)

