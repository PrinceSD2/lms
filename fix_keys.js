const fs = require('fs');

// Read the file
const filePath = './client/src/pages/Agent1Dashboard.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace both patterns
content = content.replace(/formData\.debtTypes\.map\(\(type, index\) => \(/g, 'formData.debtTypes.map((type) => (');
content = content.replace(/key={index}/g, 'key={type}');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed React key warnings in Agent1Dashboard.js');
