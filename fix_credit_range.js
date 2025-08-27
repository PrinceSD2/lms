const fs = require('fs');

// Read the file
const filePath = './client/src/pages/Agent1Dashboard.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the incorrect credit score range
content = content.replace(/750-900/g, '750-850');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed credit score range in Agent1Dashboard.js');
