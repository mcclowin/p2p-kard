# ReCircle

P2P Qard Hasan (interest-free Islamic lending) platform.

## Quick Start

### 1. Backend (Django)

```bash
cd django-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Runs on http://127.0.0.1:8000

### 2. Frontend (React)

```bash
cd P2PKardh-frontend
npm install
echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env
npm run dev
```

Runs on http://localhost:5173

### 3. Validation Service (Node.js)

```bash
cd validation
npm install
cp .env.example .env  # Configure TrueLayer, Didit keys
npm run dev
```

Runs on http://localhost:3001

## Environment Variables

**Backend** (`django-backend/.env`):
```
SECRET_KEY=your-secret-key
DEBUG=True
STRIPE_SECRET_KEY=sk_test_...
```

**Frontend** (`P2PKardh-frontend/.env`):
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Validation** (`validation/.env`):
```
TRUELAYER_CLIENT_ID=...
TRUELAYER_CLIENT_SECRET=...
DIDIT_API_KEY=...
PORT=3001
```

## API Docs

http://127.0.0.1:8000/api/docs (Swagger UI)
