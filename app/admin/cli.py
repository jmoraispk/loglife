"""Local-only admin CLI for KPIs and feedback management."""

from __future__ import annotations

import argparse
from datetime import date

from app.infra.repo_sqlite import Repo


def kpis_today(repo: Repo) -> None:
    """Print DAU for today using inbound message counts."""
    with repo.connect() as conn:
        # DAU: distinct users with inbound today
        today = date.today().isoformat()
        dau = conn.execute(
            (
                "SELECT COUNT(DISTINCT user_id) FROM messages "
                "WHERE direction='in' AND DATE(timestamp)=?"
            ),
            (today,),
        ).fetchone()[0]
        print(f"DAU: {dau}")


def feedback_list(repo: Repo) -> None:
    """List all feedback tickets with status."""
    with repo.connect() as conn:
        rows = conn.execute(
            "SELECT id, user_id, text, status, created_at FROM feedback_tickets ORDER BY id DESC"
        ).fetchall()
        for r in rows:
            print(f"#{r['id']} u{r['user_id']} [{r['status']}]: {r['text'][:60]}")


def feedback_show(repo: Repo, fid: int) -> None:
    """Show full details for a feedback ticket by id."""
    with repo.connect() as conn:
        r = conn.execute("SELECT * FROM feedback_tickets WHERE id=?", (fid,)).fetchone()
        if not r:
            print("Not found")
            return
        print(dict(r))


def feedback_close(repo: Repo, fid: int) -> None:
    """Close a feedback ticket by id."""
    with repo.connect() as conn:
        conn.execute("UPDATE feedback_tickets SET status='closed' WHERE id=?", (fid,))
    print(f"Closed #{fid}")


def main(argv: list[str] | None = None) -> int:
    """Admin CLI entrypoint (local-only)."""
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")
    sub.add_parser("kpis").add_argument("scope", choices=["today"])  # kpis today
    fb = sub.add_parser("feedback")
    fb_sub = fb.add_subparsers(dest="fb_cmd")
    fb_sub.add_parser("list")
    sh = fb_sub.add_parser("show")
    sh.add_argument("id", type=int)
    cl = fb_sub.add_parser("close")
    cl.add_argument("id", type=int)
    # users show <phone>
    users = sub.add_parser("users")
    users_sub = users.add_subparsers(dest="users_cmd")
    show = users_sub.add_parser("show")
    show.add_argument("phone")
    # habits list <phone>
    habits = sub.add_parser("habits")
    habits.add_argument("phone")
    args = parser.parse_args(argv)

    repo = Repo.default()
    if args.cmd == "kpis" and args.scope == "today":
        kpis_today(repo)
        return 0
    if args.cmd == "feedback":
        if args.fb_cmd == "list":
            feedback_list(repo)
            return 0
        if args.fb_cmd == "show":
            feedback_show(repo, args.id)
            return 0
        if args.fb_cmd == "close":
            feedback_close(repo, args.id)
            return 0
    if args.cmd == "users" and args.users_cmd == "show":
        with repo.connect() as conn:
            r = conn.execute(
                "SELECT phone, tz, prefs_json, paused FROM users WHERE phone=?",
                (args.phone,),
            ).fetchone()
            print(dict(r) if r else "Not found")
        return 0
    if args.cmd == "habits":
        with repo.connect() as conn:
            uid = conn.execute("SELECT id FROM users WHERE phone=?", (args.phone,)).fetchone()
            if not uid:
                print("Not found")
                return 0
            rows = conn.execute(
                "SELECT name, remind_hhmm, active FROM habits WHERE user_id=? ORDER BY order_idx",
                (uid[0],),
            ).fetchall()
            for r in rows:
                print(f"{r['name']} at {r['remind_hhmm']} (active={r['active']})")
        return 0
    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
