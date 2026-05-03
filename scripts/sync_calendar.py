#!/usr/bin/env python3
"""Fetch the public iCal feed and write upcoming events to data/events.json.

Reads ICAL_URL from the environment (set as a GitHub Actions secret).
Run manually: ICAL_URL=<url> python scripts/sync_calendar.py
"""

import json
import os
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

try:
    from icalendar import Calendar
except ImportError:
    print("Missing dependency: pip install icalendar", file=sys.stderr)
    sys.exit(1)

ICAL_URL = os.environ.get("ICAL_URL", "").replace("webcal://", "https://")
OUT_FILE = Path(__file__).parent.parent / "data" / "events.json"


def to_utc(dt):
    if isinstance(dt, date) and not isinstance(dt, datetime):
        return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc), True
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc), False
    return dt.astimezone(timezone.utc), False


def clean(val):
    s = str(val).strip()
    return "" if s == "None" else s


def main():
    if not ICAL_URL:
        print("Error: ICAL_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching calendar…")
    req = urllib.request.Request(
        ICAL_URL,
        headers={"User-Agent": "brandonchaselive-calendar-sync/1.0"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()

    cal    = Calendar.from_ical(raw)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=6)  # include events starting today
    events = []

    for component in cal.walk():
        if component.name != "VEVENT":
            continue

        dtstart_prop = component.get("DTSTART")
        if not dtstart_prop:
            continue

        start_dt, all_day = to_utc(dtstart_prop.dt)
        if start_dt < cutoff:
            continue

        raw_url = clean(component.get("URL", ""))
        events.append({
            "summary":  clean(component.get("SUMMARY", "")),
            "start":    start_dt.isoformat(),
            "all_day":  all_day,
            "location": clean(component.get("LOCATION", "")),
            "url":      raw_url if raw_url.startswith(("http://", "https://")) else "",
        })

    events.sort(key=lambda e: e["start"])

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(events, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(events)} upcoming event(s) to {OUT_FILE}")


if __name__ == "__main__":
    main()
