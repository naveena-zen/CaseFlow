const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../output');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 }
  });

  const page = await browser.newPage();

  // 1. Login Page
  console.log('Capturing Login Page...');
  await page.goto('http://localhost:5000/pages/login.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login.png'), fullPage: true });

  // 2. Lawyer Login & Dashboard
  console.log('Logging in as Lawyer...');
  await page.type('#email', 'lawyer@caseflow.dev');
  await page.type('#password', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);

  // Give charts a moment to animate
  await new Promise(r => setTimeout(r, 1500));
  console.log('Capturing Lawyer Dashboard...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-lawyer-dashboard.png'), fullPage: true });

  // 3. Lawyer Case Detail
  console.log('Navigating to first case detail...');
  const firstCaseLink = await page.$('table tbody tr a, table tbody tr button');
  if (firstCaseLink) {
    // Or fetch case id directly from API or current page
  }
  // Let's get the case link or navigate to the first case
  const caseId = await page.evaluate(async () => {
    const res = await fetch('/api/cases', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('CaseFlow_token') }
    });
    const cases = await res.json();
    return cases[0]?._id;
  });

  if (caseId) {
    console.log(`Capturing Lawyer Case Detail (${caseId})...`);
    await page.goto(`http://localhost:5000/pages/lawyer-case-detail.html?id=${caseId}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-lawyer-case-detail.png'), fullPage: true });
  }

  // 4. Client Dashboard
  console.log('Logging in as Client via token...');
  const clientLoginRes = await page.evaluate(async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'client@caseflow.dev', password: 'password123' })
    });
    const data = await res.json();
    localStorage.setItem('CaseFlow_token', data.token);
    localStorage.setItem('CaseFlow_user', JSON.stringify(data.user));
    return data;
  });

  console.log('Navigating to Client Dashboard...');
  await page.goto('http://localhost:5000/pages/client-dashboard.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Capturing Client Dashboard...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-client-dashboard.png'), fullPage: true });

  // 5. Client Case View
  if (caseId) {
    console.log(`Capturing Client Case View (${caseId})...`);
    await page.goto(`http://localhost:5000/pages/client-case-view.html?id=${caseId}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-client-case-view.png'), fullPage: true });
  }

  await browser.close();
  console.log('🎉 All 5 screenshots taken and saved successfully to output/ directory!');
}

main().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
