# 🚀 AI Talent Intelligence Platform – Recruiter Dashboard

A full-stack, production-ready **Recruiter Dashboard** built using the MERN stack (MongoDB, Express, React, Node.js) and a Python FastAPI service for AI Resume Intelligence, Match Scoring, ATS grading, Natural Language Smart Search, and an AI Hiring Copilot.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite build system)
- **Tailwind CSS** (curated theme palette, dark/light toggle)
- **React Router DOM** (protected routing structure)
- **Axios** (centralized API utility with JWT token attachment)
- **React Icons** (Feather icons)
- **Recharts** (animated area, bar, pie, and funnel pipelines)

### Backend
- **Node.js** & **Express.js** (modular routes and rate-limiting)
- **MongoDB Atlas** / **Mongoose** (database schemas and relations)
- **JWT Authentication** (role-based security validation)
- **Multer** (handles resume file uploads)
- **Nodemailer** (sends email candidate invitations)
- **Helmet** & **CORS** (API security headers)

### AI Service
- **Python FastAPI** (high-performance async web framework)
- **Resume text parser** (`pypdf` and `docx` heuristic processing)
- **AI Match Score** (candidate-to-job overlap calculations)
- **ATS grading engine** (resume structural evaluation)
- **Smart Query parsing** (NL queries transformed to MongoDB filters)
- **AI Hiring Copilot** (interactive chat fallback + Google Gemini API option)

---

## 📂 Folder Structure

```text
├── client/          # React Vite frontend
├── server/          # Node Express backend
├── ai-service/      # Python FastAPI AI processing engine
├── uploads/         # Shared workspace resume uploads (pdf, docx)
└── README.md        # Setup instructions and architectural documentation
```

---

## ⚙️ Setup Instructions

Ensure you have **Node.js (v18+)**, **Python (v3.10+)**, and **MongoDB** installed locally.

### 1. Database Setup
Ensure MongoDB is running locally:
- On Windows: Run `net start MongoDB` or start the MongoDB Server service.
- Default connection string is set to `mongodb://localhost:27017/recruiter-dashboard`.

### 2. AI Service Installation & Run (FastAPI)
Open a terminal in the root workspace and run:
```bash
cd ai-service
# (Optional) Create a virtual environment
python -m venv venv
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Launch FastAPI on port 8000
uvicorn main:app --reload --port 8000
```
> [!TIP]
> If you have a Google Gemini API Key, create an `ai-service/.env` file containing:
> `GEMINI_API_KEY=your_key_here`
> The copilot will automatically upgrade to use Gemini model reasoning. If not, the engine defaults to a highly functional rule-based NLP agent.

### 3. Backend Server Installation & Seeding (Node)
Open a second terminal in the root workspace and run:
```bash
cd server
npm install

# Run database seeder (populates default jobs, candidates, applications, and calendar reviews)
npm run seed

# Start server on port 5000
npm start
```
*Default recruiter account created by seeder:*
- **Email:** `recruiter@example.com`
- **Password:** `password123`

### 4. Client Application Installation & Run (Vite)
Open a third terminal in the root workspace and run:
```bash
cd client
npm install

# Start Vite React server locally
npm run dev
```
Open **`http://localhost:5173`** in your browser to log in!

---

## 🐳 Docker Setup (Production & Development)

The platform includes complete Docker support for easy deployment and development.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with Docker Compose.
- Make sure MongoDB Atlas is configured and you have the connection string.
- Create a `.env.docker` file in the root directory by copying the provided example:
  ```bash
  cp .env.docker.example .env.docker
  ```
- Edit `.env.docker` to include your real `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.

### Running with Docker Compose

**1. Start the platform:**
```bash
docker-compose up -d --build
```
This will start:
- Client (React/Vite) on port `5173`
- Server (Node/Express) on port `5000`
- AI Service (FastAPI) on port `8000`
- Redis on port `6379`

**2. Stop the platform:**
```bash
docker-compose down
```

**3. Production Mode:**
For production deployment, use the production compose file which uses optimized multi-stage builds and Nginx for the frontend:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
*(The production client will be available on port `80` instead of `5173`).*

---

## 🧠 AI Intelligence Features

1. **Resume Intelligence Parser:** Extracts candidate summaries, certifications, education history, years of experience, and evaluates CV layout to generate an ATS Readiness Score (out of 100).
2. **AI Match Scoring:** Generates candidate-to-job requisition scores (0-100%) by measuring skills overlap, experience years matching, and degree compliance, compiling explanation summaries and flagging missing criteria.
3. **AI Smart Search:** Recruiter can query candidate pipelines via natural language sentences (e.g. *"Show React developers in Pune"* or *"Find freshers having Machine Learning projects"*). The Python engine parses search targets into MongoDB queries.
4. **AI Hiring Copilot:** Interactive, floating assistant capable of ranking applicants, writing interview briefings, highlighting certifications, and answering candidate comparison inquiries.
