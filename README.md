# BamBoozle v2 (preview)
Static PWA that copies the layout of the Replit "BamBoozle" Expo app (dark & gold, tabs Now / Deals / Map / Search / Me) using the BamBoozle PWA data (data.json, menus.json copied from vegas-hh-app).
Routes: #/now, #/deals, #/map, #/search, #/me, #/spot/<id>. Test: python3 -m http.server 8799 && node /workspace/v2test.mjs
Storage keys are bb2* (imports v1 bbSaved/bbHome once, read-only).
