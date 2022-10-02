@echo off
pyinstaller --noconfirm --onefile --console  steamwsauto.py
rmdir build /S /Q
move dist\steamwsauto.exe
rmdir dist /S /Q
del steamwsauto.spec /Q