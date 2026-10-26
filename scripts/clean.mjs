import fs from 'node:fs';
for (const dir of ['reports', 'test-results', 'allure-results', 'allure-report']) {
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log('Cleaned generated test artifacts.');
