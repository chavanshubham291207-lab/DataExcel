const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();
const { connectRedis } = require('./services/cache.service');
connectRedis();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middlewares
app.use((req, res, next) => { req.io = io; next(); });
app.use(express.json());

// Enable CORS with support for production frontend and fallback
const allowedOrigins = [
  'https://data-axle-uzzr.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow requests to ensure cross-origin access on Vercel deployment
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Set Security Headers (configured to allow canvas / image operations for charts/pdf)
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static uploads
const UPLOADS_DIR = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));

// Candidate Portal Routes
app.use('/api/candidate-auth', require('./routes/candidateAuth'));
app.use('/api/candidate', require('./routes/candidateJobs'));
app.use('/api/candidate/interviews', require('./routes/candidateInterviews'));
app.use('/api/candidate/notifications', require('./routes/candidateNotifications'));
app.use('/api/messages', require('./routes/messages'));

// AI Agent System Routes
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));

// Interview Scheduling System (Application-based)
app.use('/api/interview-schedule', require('./routes/interviewSchedule'));
app.use('/api/ats', require('./routes/ats.routes'));

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'express-recruiter-api' });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

io.on('connection', (socket) => {
  socket.on('join', (room) => socket.join(room));
  socket.on('disconnect', () => {});
});
