"""Parser unit tests."""

from app.core.parser import parse_command


def test_parse_add():
    """Ensure add command is parsed with raw argument preserved."""
    cmd = parse_command("add Run 20m at 19:00")
    assert cmd.kind == "add"
    assert "Run" in cmd.arg


def test_parse_checkin_variants():
    """Check that multiple checkin syntaxes are recognized."""
    assert parse_command("3").kind == "checkin"
    assert parse_command("321").kind == "checkin"
    assert parse_command("3 2 1").kind == "checkin"
    assert parse_command("✅⚠️❌").kind == "checkin"
