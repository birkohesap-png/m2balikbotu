# bot_dogrula.py

Oyundaki "Bot Verify" penceresini cozer (sayiyi okur, numpad'e mouse ile tiklar, OK'e basar).

## Ilk kurulum (gercek oyunda, 1 kez)
1. `pip install -r requirements.txt`
2. Oyunda dogrulama penceresi acikken: `python bot_dogrula.py --pencere-kaydet`
   (5 sn icinde fareyi pencerenin SOL UST kosesine goturun) -> `pencere.png`
3. Pencere her acildiginda `python bot_dogrula.py --ogren` -> sayiyi yazin. Her rakamdan
   (0-9) en az 3-5 ornek toplayin -> `rakamlar/`
4. `python bot_dogrula.py --test` sayiyi dogru okuyor mu bakin (tiklamaz)
5. `python bot_dogrula.py --coz` gercek tiklama testi

## Bota baglama
```python
from bot_dogrula import BotDogrula
bd = BotDogrula(klasor=r"...\istemci")
if bd.pencere_var_mi():
    if not bd.coz():
        ...  # botu durdur, Telegram'a haber ver
```

## Testler
`python -m pytest test_bot_dogrula.py` (sahte ekran/fare ile; oyun gerekmez)

## Bilinen sinirlar
- Tus/kutu konumlari (`TUSLAR`, `SAYI_KUTUSU`) 800x600 ornek goruntuden olculdu; gercek
  ekranda kayiyorsa bu sabitleri ayarlayin.
- Sayi gurultulu/egriyse sablon eslestirme yetmeyebilir; `rakamlar/_son_kutu.png` ornegini
  gonderin, okuyucu o veriyle gelistirilir.
- Dusuk guvenle okursa tiklamaz, `False` doner (yanlis sayiyla hata sayaci artmasin diye).
