/*
 * CaseFlow - Legal Case Management Platform
 * ==========================================
 * To view data in MongoDB Compass:
 * 1. Open MongoDB Compass
 * 2. Connect to: mongodb://localhost:27017
 * 3. Click on database: caseflow
 * 4. Collections: users, cases, documents, deadlines
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploads as static
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/deadlines', require('./routes/deadlines'));

// Fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Auto-seed
const seedDB = async () => {
  const User = require('./models/User');
  const Case = require('./models/Case');
  const Deadline = require('./models/Deadline');
  const Document = require('./models/Document');

  const lawyerExists = await User.findOne({ email: 'theju@lex.com' });
  if (lawyerExists) return;

  console.log('Clearing old data and seeding database...');
  await User.deleteMany({});
  await Case.deleteMany({});
  await Deadline.deleteMany({});
  await Document.deleteMany({});

  // Lawyers
  const theju  = new User({ name: 'Theju',  email: 'theju@lex.com',  password: 'pass123', role: 'lawyer' });
  const harish = new User({ name: 'Harish', email: 'harish@lex.com', password: 'pass123', role: 'lawyer' });
  // Clients
  const arjun  = new User({ name: 'Arjun',  email: 'arjun@lex.com',  password: 'pass123', role: 'client' });
  const maya   = new User({ name: 'Maya',   email: 'maya@lex.com',   password: 'pass123', role: 'client' });

  await theju.save();
  await harish.save();
  await arjun.save();
  await maya.save();

  const cases = [
    { title: 'Arjun vs. Land Authority',           description: 'Property boundary dispute filed by Arjun against the local land authority.', status: 'Open',   lawyerId: theju._id,  clientId: arjun._id },
    { title: "Maya's Estate Settlement",            description: "Probate proceedings and estate distribution for Maya's inherited property.",   status: 'Active', lawyerId: theju._id,  clientId: maya._id  },
    { title: 'Arjun — Corporate Contract Dispute',  description: 'Breach of contract claim involving Arjun\'s software company.',               status: 'Active', lawyerId: harish._id, clientId: arjun._id },
    { title: 'Maya vs. Insurance Company',          description: 'Insurance claim denial dispute handled by Harish on behalf of Maya.',          status: 'Closed', lawyerId: harish._id, clientId: maya._id  }
  ];

  const savedCases = await Case.insertMany(cases);

  const deadlines = [];
  savedCases.forEach((c) => {
    deadlines.push({ caseId: c._id, title: 'File Initial Pleadings', dueDate: new Date(Date.now() + 7  * 24 * 60 * 60 * 1000) });
    deadlines.push({ caseId: c._id, title: 'Submit Evidence',         dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) });
  });

  await Deadline.insertMany(deadlines);

  console.log('Seed complete: Theju, Harish (lawyers) | Arjun, Maya (clients) | 4 cases | 8 deadlines created');
};

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
