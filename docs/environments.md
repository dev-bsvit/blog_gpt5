# Environments & Flags

## API (FastAPI)

- ALLOW_UNAUTH_WRITE: default false. When true (local/dev), API may accept fallback `X-User-Id` for comments and uploads.
- UPLOAD_MAX_BYTES: default 10485760 (10MB).
- RATE_LIMIT_RPS: default 5.0
- RATE_LIMIT_BURST: default 10
- CORS_ORIGINS: comma-separated list of allowed origins. Must include Vercel domain in prod.

## Frontend (Next.js)

- NEXT_PUBLIC_API_BASE: e.g., `https://<service>.onrender.com/api/v1`
- NEXT_PUBLIC_SITE_URL: public site URL
- Firebase public keys

## Local backend

- Python API (FastAPI) now runs on http://localhost:4000
- Start:

```
cd services/python
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r api/requirements.txt
uvicorn services.python.api.main:app --host 0.0.0.0 --port 4000
```

- Frontend expects `NEXT_PUBLIC_API_BASE=http://localhost:4000/api/v1`

## Legacy

- Java Spring Boot backend was removed. All endpoints preserved in Python API.

# Environments
Frontend (.env.local):
- NEXT_PUBLIC_API_BASE=
- NEXT_PUBLIC_FIREBASE_API_KEY=
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
- NEXT_PUBLIC_FIREBASE_APP_ID=
