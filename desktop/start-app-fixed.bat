@echo off
echo ========================================
echo Starting Contract Risk Management System
echo ========================================
echo.
echo Database schema has been updated with:
echo - Added 'title' column to clauses table
echo - Added 'level' column to clauses table
echo - Added 'parent_id' column to clauses table
echo - Added 'order_index' column to clauses table
echo.
echo Old database has been deleted.
echo A new database will be created on first run.
echo.
echo Default users:
echo - admin / Admin@123
echo - user1 / User@123
echo - test / Test@123
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm start

pause
