```python
#!/usr/bin/env python3
# Simple aggregator: reads JSONL of records (as written by collector), aggregates:
# - visits per day
# - unique IPs per day
# - average session duration
# - top clicked labels
# Writes a Markdown report file.
import sys, json, collections, datetime

def read_jsonl(path):
    with open(path) as f:
        for line in f:
            line=line.strip()
            if not line: continue
            yield json.loads(line)

def iso_day(ts):
    try:
        return datetime.datetime.fromtimestamp(ts/1000).strftime('%Y-%m-%d')
    except:
        # assume ISO string
        try:
            return datetime.datetime.fromisoformat(ts).strftime('%Y-%m-%d')
        except:
            return 'unknown'

def main(infile, outfile):
    visits_per_day = collections.Counter()
    unique_ips_per_day = collections.defaultdict(set)
    total_session_ms = 0
    session_count = 0
    clicks = collections.Counter()

    for rec in read_jsonl(infile):
        # rec structure: {received_at, ip, ua, payload}
        ip = rec.get('ip') or 'unknown'
        payload = rec.get('payload') or {}
        events = payload.get('events') or []
        for ev in events:
            ev_type = ev.get('type')
            ts = ev.get('ts')
            day = iso_day(ts)
            if ev_type == 'pageview':
                visits_per_day[day] += 1
                unique_ips_per_day[day].add(ip)
            elif ev_type == 'session_end':
                session_count += 1
                total_session_ms += ev.get('duration_ms', 0)
            elif ev_type == 'click':
                label = ev.get('label') or 'unknown'
                clicks[label] += 1

    avg_session = (total_session_ms / session_count / 1000) if session_count else 0

    # write report
    with open(outfile, 'w') as f:
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
        print("Usage: process_analytics.py raw_logs.jsonl report.md")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
