const bcrypt = require('bcryptjs');

const testPassword = async () => {
  const password = 'SuperAdmin123!';
  console.log('Original password:', password);
  
  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log('Hashed password:', hashedPassword);
  
  // Test comparison
  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('Comparison result:', isMatch);
  
  // Test with different variations
  const variations = [
    'SuperAdmin123!',
    'superadmin123!',
    'SUPERADMIN123!',
    'SuperAdmin123',
    ' SuperAdmin123!',
    'SuperAdmin123! '
  ];
  
  console.log('\nTesting variations:');
  for (const variant of variations) {
    const match = await bcrypt.compare(variant, hashedPassword);
    console.log(`"${variant}": ${match}`);
  }
};

testPassword().catch(console.error);
