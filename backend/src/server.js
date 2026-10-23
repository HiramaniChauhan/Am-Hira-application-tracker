import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { authRouter } from './routes/auth.routes.js';
import { companiesRouter } from './routes/companies.routes.js';
import { applicationsRouter } from './routes/applications.routes.js';
import { linksRouter } from './routes/links.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Initialize SQLite database
initDatabase();

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/links', linksRouter);

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    appName: 'EasyJobApplied API',
    message: 'EasyJobApplied API is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'EasyJobApplied API',
    database: 'SQLite',
    time: new Date().toISOString()
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`EasyJobApplied Backend running on http://localhost:${PORT}`);
    console.log(`Database: SQLite`);
    console.log(`Admin Account: hiramanichauhan2399@gmail.com (Protected in SQLite)`);
    console.log(`===============================================`);
  });
}

export default app;

