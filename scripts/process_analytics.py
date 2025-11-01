#!/usr/bin/env python3
"""
Aggregate raw_logs.jsonl into a Markdown report.

Usage:
  python3 scripts/process_analytics.py raw_logs.jsonl reports/analytics-YYYY-MM-DD.md
"""
import sys, json, collections, datetime, os

def read_jsonl(path):
    with open(path, encoding='utf-8') as f:
        for line in f:
            line=line.strip()
            if not line: continue
            try:
                yield json.loads(line)
            except:
                # try to recover lines that are arrays/objects without newline
                try:
                    # attempt to parse as single object
                    obj = json.loads(line)
                    yield obj
                except:
                    continue

def to_day_from_iso(iso):
    try:
        dt = datetime.datetime.fromisoformat(iso.replace('Z',''))
        return dt.date().isoformat()
    except:
        return 'unknown'

def main(infile, outfile):
    visits_per_day = collections.Counter()
    unique_ips_per_day = collections.defaultdict(set)
    total_session_ms = 0
    session_count = 0
    clicks = collections.Counter()

    for rec in read_jsonl(infile):
        ip = rec.get('ip', 'unknown')
        payload = rec.get('payload') or {}
        events = payload.get('events') or []
        for ev in events:
            ev_type = ev.get('type')
            ts = ev.get('ts') or ev.get('ts') or payload.get('ts') or rec.get('received_at')
            day = to_day_from_iso(ts) if isinstance(ts, str) else to_day_from_iso(payload.get('ts') or rec.get('received_at'))
            if ev_type == 'pageview':
                visits_per_day[day] += 1
                unique_ips_per_day[day].add(ip)
            elif ev_type == 'session_end':
                session_count += 1
                total_session_ms += ev.get('duration_ms', 0)
            elif ev_type == 'click':
                label = ev.get('label') or 'unknown'
                clicks[label] += 1

    avg_session = (total_session_ms / session_count / 1000) if session_count else 0.0

    os.makedirs(os.path.dirname(outfile) or '.', exist_ok=True)
    with open(outfile, 'w', encoding='utf-8') as f:
        f.write(f"# Analytics Report ({datetime.date.today().isoformat()})\n\n")
        f.write("## Visits per day\n\n")
        for day, cnt in sorted(visits_per_day.items()):
            uniq = len(unique_ips_per_day.get(day, []))
            f.write(f"- {day}: {cnt} visits, {uniq} unique IPs\n")
        f.write("\n")
        f.write(f"## Session duration\n\n- Average session duration: {avg_session:.1f} seconds (based on {session_count} sessions)\n\n")
        f.write("## Top clicked elements\n\n")
        for label, c in clicks.most_common(30):
            f.write(f"- {label}: {c}\n")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: process_analytics.py raw_logs.jsonl report.md", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
