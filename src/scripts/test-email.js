// test-email.js
import { sendConfirmationEmail } from '../scripts/mailSender.js';

// Test data
const testData = {
  email: 'yadavatarun18@gmail.com', // Your email for testing
  name: 'Tarun',
  report: {
    _id: 'test123',
    title: 'Test Report',
    category: 'Infrastructure',
    urgency: 'Medium',
    status: 'Pending',
    latitude: 12.971598,
    longitude: 77.594566,
    createdAt: new Date()
  }
};

async function test() {
  try {
    console.log('Testing email sending...');
    const result = await sendConfirmationEmail(
      testData.email,
      testData.name,
      testData.report
    );
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();