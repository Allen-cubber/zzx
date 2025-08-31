@echo off
rem // 设置窗口标题
title Hugo Blog Publisher

rem // 提示用户输入提交信息
set /p commit_message="Enter your commit message: "

rem // 检查用户是否输入了信息
if "%commit_message%"=="" (
    echo.
    echo [ERROR] Commit message cannot be empty!
    echo Please run the script again and provide a message.
    pause
    exit /b
)

echo.
echo ===================================================
echo  Step 1: Adding all changes...
git add .
echo [SUCCESS] All changes added.
echo.

echo ===================================================
echo  Step 2: Committing changes...
git commit -m "%commit_message%"
echo [SUCCESS] Commit created with message: "%commit_message%"
echo.

echo ===================================================
echo  Step 3: Pushing to GitHub...
git push
echo [SUCCESS] Pushed to remote repository.
echo.

echo ===================================================
echo  Deployment script finished!
echo  Your website will be updated on Vercel shortly.
echo ===================================================
echo.

rem // 暂停窗口，让用户可以看到最终结果
pause