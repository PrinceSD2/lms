@echo off
echo ====================================
echo Lead Management System Setup
echo ====================================
echo.

echo Installing root dependencies...
npm install

echo.
echo Installing server dependencies...
cd server
npm install
cd ..

echo.
echo Installing client dependencies...
cd client
npm install
cd ..

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Copy server\.env.example to server\.env
echo 2. Configure your MongoDB URI and other settings in server\.env
echo 3. Run 'npm run seed' to create admin user
echo 4. Run 'npm run dev' to start both client and server
echo.
echo For more information, see README.md
pause
