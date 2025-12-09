// Script para generar hash de contraseña
// Ejecutar con: node generate_password_hash.js

const bcrypt = require('bcryptjs');

const password = 'admin2024';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verificar que el hash funciona
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error verifying hash:', err);
      return;
    }
    console.log('Hash verification:', result);
  });
});







