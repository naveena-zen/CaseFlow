require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Case = require('./models/Case');
const Deadline = require('./models/Deadline');
const Document = require('./models/Document');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🔄 Cleaning existing collections for idempotent seeding...');
    await Promise.all([
      User.deleteMany({}),
      Case.deleteMany({}),
      Deadline.deleteMany({}),
      Document.deleteMany({})
    ]);

    console.log('👤 Seeding synthetic users (lawyers & clients)...');
    const lawyer1 = new User({
      name: 'Eleanor Vance, Esq.',
      email: 'lawyer@caseflow.dev',
      password: 'password123',
      role: 'lawyer'
    });

    const lawyer2 = new User({
      name: 'Marcus Sterling, Esq.',
      email: 'm.sterling@caseflow.dev',
      password: 'password123',
      role: 'lawyer'
    });

    const client1 = new User({
      name: 'Apex Horizon Tech LLC',
      email: 'client@caseflow.dev',
      password: 'password123',
      role: 'client'
    });

    const client2 = new User({
      name: 'Sophia Reed',
      email: 'sophia.reed@example.com',
      password: 'password123',
      role: 'client'
    });

    await lawyer1.save();
    await lawyer2.save();
    await client1.save();
    await client2.save();

    console.log('⚖️ Seeding synthetic legal cases...');
    const cases = [
      {
        title: 'Apex Horizon vs. CyberNet Systems',
        description: 'Intellectual property and software license compliance dispute.',
        status: 'Open',
        lawyerId: lawyer1._id,
        clientId: client1._id
      },
      {
        title: 'Sophia Reed Property Trust Settlement',
        description: 'Real estate deed transfer and probate trust administration.',
        status: 'Active',
        lawyerId: lawyer1._id,
        clientId: client2._id
      },
      {
        title: 'Apex Horizon — Employment Contract Review',
        description: 'Executive employment non-compete agreement review.',
        status: 'Active',
        lawyerId: lawyer2._id,
        clientId: client1._id
      },
      {
        title: 'Sophia Reed vs. Cascade Insurance',
        description: 'Commercial liability insurance claim appeal.',
        status: 'Closed',
        lawyerId: lawyer2._id,
        clientId: client2._id
      }
    ];

    const savedCases = await Case.insertMany(cases);

    console.log('📅 Seeding initial deadlines...');
    const deadlines = [];
    savedCases.forEach((c) => {
      deadlines.push({
        caseId: c._id,
        title: 'File Initial Pleadings',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      deadlines.push({
        caseId: c._id,
        title: 'Discovery Document Submission',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
    });

    await Deadline.insertMany(deadlines);

    console.log('✅ Idempotent seed completed successfully!');
    console.log('Created default accounts:');
    console.log(' - Lawyer: lawyer@caseflow.dev / password123');
    console.log(' - Client: client@caseflow.dev / password123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
