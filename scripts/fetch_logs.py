#!/usr/bin/env python3
"""
Fetch JSONL log files from a Google Drive folder and concatenate them into a single JSONL file.

Requirements:
  pip install google-api-python-client google-auth-httplib2 google-auth

Environment variables / inputs:
  - GCP_SA_KEY_JSON: the service account key JSON (raw string) or path to JSON file (if you prefer)
  - ANALYTICS_DRIVE_FOLDER_ID: Drive folder id
  - OUTPUT_FILE: output path (default raw_logs.jsonl)

This script lists files in the given folder and downloads each file content, writing it into OUTPUT_FILE.
"""
import os
import sys
import io
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

def get_credentials():
    key = os.environ.get('GCP_SA_KEY_JSON')
    if not key:
        raise SystemExit('GCP_SA_KEY_JSON required')
    try:
        # if environment has JSON text, parse it
        creds_json = json.loads(key)
        creds = service_account.Credentials.from_service_account_info(creds_json, scopes=['https://www.googleapis.com/auth/drive.readonly'])
        return creds
    except Exception:
        # assume key is path
        creds = service_account.Credentials.from_service_account_file(key, scopes=['https://www.googleapis.com/auth/drive.readonly'])
        return creds

def list_files(drive_service, folder_id):
    q = f"'{folder_id}' in parents and trashed = false"
    files = []
    page_token = None
    while True:
        res = drive_service.files().list(q=q, fields='nextPageToken, files(id, name, mimeType, size, createdTime)', pageToken=page_token).execute()
        files.extend(res.get('files', []))
        page_token = res.get('nextPageToken')
        if not page_token:
            break
    return files

def download_file(drive_service, file_id):
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, drive_service.files().get_media(fileId=file_id))
    done = False
    while not done:
        status, done = downloader.next_chunk()
    fh.seek(0)
    return fh.read().decode('utf-8')

def main():
    folder_id = os.environ.get('ANALYTICS_DRIVE_FOLDER_ID')
    if not folder_id:
        print("ANALYTICS_DRIVE_FOLDER_ID required", file=sys.stderr)
        sys.exit(1)
    out = os.environ.get('OUTPUT_FILE', 'raw_logs.jsonl')

    creds = get_credentials()
    drive = build('drive', 'v3', credentials=creds, cache_discovery=False)

    files = list_files(drive, folder_id)
    # sort by createdTime
    files.sort(key=lambda x: x.get('createdTime', ''))

    with open(out, 'w', encoding='utf-8') as outf:
        for f in files:
            try:
                content = download_file(drive, f['id'])
                # If file is JSON array, convert to JSONL
                try:
                    parsed = json.loads(content)
                    if isinstance(parsed, list):
                        for obj in parsed:
                            outf.write(json.dumps(obj) + '\n')
                    elif isinstance(parsed, dict):
                        # single object
                        outf.write(json.dumps(parsed) + '\n')
                    else:
                        # fallback: write raw
                        outf.write(content + '\n')
                except Exception:
                    # assume already JSONL or text
                    outf.write(content.strip() + '\n')
            except Exception as e:
                print("Error downloading", f.get('name'), e, file=sys.stderr)
    print("Wrote combined logs to", out)

if __name__ == '__main__':
    main()
