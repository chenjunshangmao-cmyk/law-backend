@echo off
cd /d c:\Users\Administrator\WorkBuddy\Claw\frontend
call npx vite build > ..\build-out.txt 2>&1
echo DONE >> ..\build-out.txt
