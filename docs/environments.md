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
