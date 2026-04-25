# Courtly

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:3000

## Backend

```bash
cd backend
python3 -m venv .venv        # first time only
.venv/bin/pip install -r requirements.txt  # first time only
.venv/bin/uvicorn main:app --reload
```

Runs on http://localhost:8000
