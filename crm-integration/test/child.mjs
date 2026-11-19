// A stand-in for one CRM worker: connects to the temporary database and runs the website link, nothing else.
await import('./src/websiteSync/plugin.js');
const mongoose = (await import('mongoose')).default;
for (const n of ['Developer', 'Lookup', 'City']) await import('./src/models/' + n + '.js');
await mongoose.connect(process.env.TEST_MONGO_URI);
const { startWebsiteSync } = await import('./src/websiteSync/index.js');
await startWebsiteSync();
setInterval(() => {}, 1 << 30);
