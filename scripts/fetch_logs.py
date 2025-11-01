```python
#!/usr/bin/env python3
# Simple fetcher that pulls JSONL logs from ANALYTICS_LOG_URL
# This assumes the url returns either a JSON array or new-line separated JSON objects.
import os, sys, requests, json

def fetch(url, out):
    headers={}
    key = os.getenv('ANALYTICS_API_KEY')
    if key:
        headers['Authorization'] = f'Bearer {key}'
    r = requests.get(url, headers=headers, timeout=60)
    r.raise_for_status()
    text = r.text
    # normalize to JSON lines
    try:
        arr = r.json()
        if isinstance(arr, list):
            with open(out, 'w') as f:
                for obj in arr:
                    f.write(json.dumps(obj) + '\n')
            return
    except:
        pass
    # otherwise assume it's already JSONL
    with open(out, 'w') as f:
        f.write(text)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: fetch_logs.py --out raw_logs.jsonl", file=sys.stderr)
        sys.exit(1)
    out = sys.argv[-1]
    url = os.environ.get('ANALYTICS_LOG_URL')
    if not url:
        print("ANALYTICS_LOG_URL env required", file=sys.stderr); sys.exit(1)
    fetch(url, out)
