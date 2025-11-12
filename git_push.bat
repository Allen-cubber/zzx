@echo off
echo.
echo --- 1. Staging all changes (git add .) ---
git add .
echo.

echo --- 2. Committing with a default message (git commit) ---
git commit -m"Regular update"
echo.

echo --- 3. Pushing to remote (git push) ---
git push
echo.

echo --- All commands executed. ---
pause