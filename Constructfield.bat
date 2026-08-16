@echo off
title Constructfield Desktop
echo Launching Constructfield Desktop Application...
if exist "Constructfield-App.exe" (
    Constructfield-App.exe
) else if exist "ConstructOS-App.exe" (
    ConstructOS-App.exe
) else (
    npm run dev
)
