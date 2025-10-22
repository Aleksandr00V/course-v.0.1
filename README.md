# Course v.0.1 — Equipment tracker

Коротко
-------
Простий односторінковий додаток (React + Vite) та мінімальний бекенд на Node/Express з JSON-файлом як сховищем. Додаток дозволяє реєструвати/логінити користувачів, переглядати та керувати технікою, водіями, заявками та поїздками.

Структура проєкту
-----------------
- `client/` — React (TypeScript) фронтенд на Vite
- `server/` — Node.js/Express бекенд (JSON `db.json` для зберігання)
- `uploads/` — папка для завантажених файлів (зображення)

Швидкий старт (Windows / PowerShell)
-----------------------------------
1. Встановити Node.js (рекомендовано 18+).
2. В корені проєкту запустити:

```powershell
npm install
npm run dev
```

Це запустить одночасно бекенд і фронтенд за допомогою `concurrently`:
- Фронтенд: `http://localhost:5173` (Vite)
- Бекенд: `http://localhost:5001` (Express)

Примітка: якщо виникає проблема з портами або проксі, перевірте `client/vite.config.ts` і `server/index.js` (порт). За замовчуванням проксі в Vite налаштовано на `http://localhost:5001`.

Окремо (якщо потрібно запустити вручну)
--------------------------------------
Фронтенд:
```powershell
cd client
npm install
npm run dev
```

Бекенд:
```powershell
cd server
npm install
npm run dev
```

Налаштування Git / GitHub
-------------------------
Якщо ще не підключено remote, додайте його:

```powershell
git remote add origin https://github.com/Aleksandr00V/course-v.0.1.git
git branch -M main
git push -u origin main
```

Типи користувачів
------------------
- `user` — базовий користувач
- `admin` — адміністратор (може схвалювати реєстрації)
- `superadmin` — повні права

Секрети й змінні середовища
---------------------------
- `JWT_SECRET` — секрет для підпису JWT (в `server/index.js`). Для продакшену встановіть через змінні середовища.

FAQ / Troubleshooting
---------------------
- Помилка `ECONNREFUSED` при запитах з фронтенду: перевірте, щоб сервер був запущений і порт в `vite.config.ts` співпадав з серверним.
- Якщо 401/403 на запитах авторизації: перевірте правильність облікових даних і статус користувача в `server/db.json`.
- Додайте `node_modules/` в `.gitignore` (вже зроблено).

Контакти
--------
Проєкт в GitHub: https://github.com/Aleksandr00V/course-v.0.1

---
Зроблю пуш цього README в `main` зараз.
