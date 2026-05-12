const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { seedDatabase } = require('./seed/seedAdmin');
const User = require('./models/User');

dotenv.config();

const startServer = async () => {
  await connectDB();

  if (process.env.SEED_DEMO_DATA === 'true') {
    await seedDatabase({ reset: false });
  }

  await User.updateOne(
    { email: 'admin@caretrack.com', name: 'Zarina Abdullaeva' },
    { $set: { name: 'newuser4584' } }
  );
};

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'CareTrack MRMS API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'caretrack-mrms-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/dashboard', dashboardRoutes);

const frontendBuildPath = path.join(__dirname, 'public');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

startServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  });
