@echo off
start /B youcode.exe >1.out
@REM sleep 10
@REM set exeName=a.exe
@REM for /f "tokens=5 delims= " %%i in ('tasklist ^|findstr "%exeName%"') do (
@REM     for /f "tokens=1,2 delims=," %%j in ("%%i") do echo %%j%%k
@REM )
@REM timeout /t 1
taskkill /im youcode.exe /F 
