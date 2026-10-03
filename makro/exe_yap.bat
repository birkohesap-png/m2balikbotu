@echo off
REM K34 Makro'yu tek dosyalik .exe yapar (Python yuklu olmali)
pip install --upgrade pyinstaller
pyinstaller --onefile --noconsole --name K34Makro k34_makro.py
echo.
echo Hazir: dist\K34Makro.exe
pause
