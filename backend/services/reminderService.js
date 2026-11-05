const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Deadline = require('../models/Deadline');
const Case = require('../models/Case');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || 'dev_user',
      pass: process.env.SMTP_PASS || 'dev_pass'
    }
  });
};

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    // 1-day threshold (24h +/- 12h)
    const oneDayStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const oneDayEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    // 3-day threshold (72h +/- 12h)
    const threeDayStart = new Date(now.getTime() + 60 * 60 * 60 * 1000);
    const threeDayEnd = new Date(now.getTime() + 84 * 60 * 60 * 1000);

    const deadlines = await Deadline.find({
      $or: [
        { dueDate: { $gte: oneDayStart, $lte: oneDayEnd } },
        { dueDate: { $gte: threeDayStart, $lte: threeDayEnd } }
      ]
    }).populate({
      path: 'caseId',
      populate: [
        { path: 'lawyerId', select: 'name email' },
        { path: 'clientId', select: 'name email' }
      ]
    });

    if (deadlines.length === 0) {
      console.log('📅 [ReminderCron] No upcoming 1-day or 3-day deadlines found.');
      return { sentCount: 0 };
    }

    const transporter = createTransporter();
    let sentCount = 0;

    for (const d of deadlines) {
      if (!d.caseId) continue;

      const lawyerEmail = d.caseId.lawyerId ? d.caseId.lawyerId.email : null;
      const clientEmail = d.caseId.clientId ? d.caseId.clientId.email : null;
      const recipients = [lawyerEmail, clientEmail].filter(Boolean);

      const daysLeft = Math.round((new Date(d.dueDate) - now) / (1000 * 60 * 60 * 24));
      const subject = `[CaseFlow Reminder] Upcoming Deadline: "${d.title}" due in ${daysLeft} day(s)`;
      const text = `Hello,\n\nThis is an automated reminder that the deadline "${d.title}" for case "${d.caseId.title}" is due on ${new Date(d.dueDate).toLocaleString()}.\n\nPlease ensure all necessary filings or actions are completed on time.\n\nBest regards,\nCaseFlow Platform`;

      for (const to of recipients) {
        try {
          // Log email dispatch
          console.log(`📧 [ReminderCron] Dispatching email reminder to ${to} for deadline "${d.title}"`);
          if (process.env.NODE_ENV !== 'test') {
            await transporter.sendMail({
              from: '"CaseFlow Platform" <reminders@caseflow.dev>',
              to,
              subject,
              text
            });
          }
          sentCount++;
        } catch (mailErr) {
          console.error(`Failed to send email to ${to}:`, mailErr.message);
        }
      }
    }

    return { sentCount };
  } catch (err) {
    console.error('Error running reminder cron:', err);
    return { error: err.message };
  }
};

const startReminderCron = () => {
  // Run every day at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily deadline reminder cron job...');
    await checkAndSendReminders();
  });
};

module.exports = {
  checkAndSendReminders,
  startReminderCron
};
