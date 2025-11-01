// Collector: Node.js Express handler to run on Cloud Run / Cloud Function / any HTTPS host
// Purpose: receive POSTed batches and create JSONL files in Google Drive folder (one file per batch).
//
// Expected env vars / secrets:
// - GOOGLE_SERVICE_ACCOUNT_KEY_JSON (base64 or raw JSON string of service account key) OR use ADC in environment
// - ANALYTICS_DRIVE_FOLDER_ID (Drive folder ID where logs will be created)
// - ANALYTICS_API_KEY (optional — client must include X-Analytics-Key header to accept requests)
// - ANONYMIZE_IP=true/false (optional) if true the collector will truncate IPv4 to /24 and remove last segment
//
// Deploy: Cloud Run or Cloud Functions with Node 18+. Enable Drive API for the project and share the target Drive folder
// with the service account email (or give permissions via domain policies).
//
const express = require('express');
const {google} = require('googleapis');
const crypto = require('crypto');

const app = express();
app.use(express.json({limit: '256kb'}));

const DRIVE_FOLDER_ID = process.env.ANALYTICS_DRIVE_FOLDER_ID;
const SA_KEY_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON; // raw JSON string
const ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY || '';
const ANONYMIZE_IP = (process.env.ANONYMIZE_IP || 'false').toLowerCase() === 'true';

if (!DRIVE_FOLDER_ID) {
  console.error('ANALYTICS_DRIVE_FOLDER_ID not set');
}

function initAuth() {
  if (SA_KEY_JSON) {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(SA_KEY_JSON),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  } else {
    // Use Application Default Credentials (if deployed on GCP with appropriate SA)
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  }
}

const auth = initAuth();
const drive = google.drive({version: 'v3', auth});

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function anonymizeIp(ip) {
  if (!ip) return 'unknown';
  if (!ANONYMIZE_IP) return ip;
  // basic IPv4 truncation to /24 and mask last octet; IPv6 fallback: hash
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) { parts[3] = '0'; return parts.join('.'); }
  }
  // fallback: return a short hash
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

async function uploadJsonl(content, filename) {
  // create a file under DRIVE_FOLDER_ID with MIME type application/json
  const metadata = {
    name: filename,
    parents: [DRIVE_FOLDER_ID]
  };
  const res = await drive.files.create({
    requestBody: metadata,
    media: {
      mimeType: 'application/json',
      body: content
    },
    fields: 'id,name'
  });
  return res.data;
}

app.post('/collect', async (req, res) => {
  try {
    if (ANALYTICS_API_KEY) {
      const provided = req.header('X-Analytics-Key') || '';
      if (!provided || provided !== ANALYTICS_API_KEY) {
        return res.status(401).send('invalid key');
      }
    }
    const body = req.body;
    if (!body || !body.events) return res.status(400).send('invalid payload');

    // capture IP from request (Cloud Run/CF will typically have X-Forwarded-For)
    const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = xff || req.ip || req.connection.remoteAddress || 'unknown';
    const anonymized = anonymizeIp(ip);

    // build record that will be written as JSON lines (one JSON object per request)
    const record = {
      received_at: new Date().toISOString(),
      ip: anonymized,
      ua: req.headers['user-agent'] || '',
      payload: body
    };

    // Each file will contain a single JSON object (but named .jsonl so multiple files can be concatenated)
    const filename = `logs-${nowStamp()}-${Math.random().toString(36).slice(2,8)}.jsonl`;
    const content = JSON.stringify(record) + '\n';

    const uploaded = await uploadJsonl(content, filename);
    return res.status(200).json({ok: true, file: uploaded});
  } catch (err) {
    console.error('collector error', err);
    return res.status(500).send('internal error');
  }
});

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Collector listening on ${PORT}`));
}

module.exports = app;
