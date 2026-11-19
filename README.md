# מעקב פרויקטים – Project Manager

מערכת לניהול פרויקטים של מחלקת הלמידה: פרויקטים ולידים, לקוחות, שיוך עובדים, תיעוד פגישות, משימות, שלבי עבודה, לוח קנבן, ישיבת סטטוס, חשבוניות, תוכנית עבודה, מידע חשוב, כח אדם ומפת עומסים.
המערכת מיועדת למחשבים (מסך 13–15 אינץ׳), בעברית ו-RTL.

## מבנה

| תיקייה | תוכן |
|---|---|
| `BackEnd` | Node.js + Express + TypeScript. `src/` → `controllers`, `services`, `models`, `enum`, `middleware`, `utils`, `app.ts` |
| `dataBase` | MySQL. `01-init.sql` – טבלאות, `02-seed.sql` – הנתונים מהמערכת הקודמת (לא נשמר בגיט) |
| `FrontEnd` | React + TypeScript + MUI (Vite). `src/components/` → אזורים (`project-area`, `user-area`, `customer-area`…), `models`, `service`, `redux`, `utils` |

## הרשאות

| תפקיד | מה מותר |
|---|---|
| `admin` | הכל, כולל ניהול משתמשים והרשאות, ומחיקת פרויקטים ולקוחות |
| `manager` | פתיחת פרויקטים ולידים, שיוך עובדים, לקוחות, חשבוניות, כח אדם, מפת עומסים, תוכנית עבודה ומידע חשוב |
| `employee` (ברירת מחדל) | רואה **רק** פרויקטים שהוא משויך אליהם. מתעד פגישות, מעדכן שלבים וסטטוס, מבצע ומוסיף משימות |

## התחברות

אין סיסמה. מזינים מייל, נשלח קוד חד-פעמי בן 6 ספרות (בתוקף 10 דקות), ואחרי האימות מתקבל JWT לשעות 12 (בעוגיית httpOnly).
בפיתוח, בלי SMTP, הקוד מודפס בקונסול של השרת.
האדמין הראשון נוצר אוטומטית מ-`ADMIN_EMAIL`. את שאר המשתמשים מוסיפים במסך "משתמשים והרשאות".

> בנתונים שיובאו מהמערכת הקודמת נוצרו משתמשים לאנשי הצוות עם מיילים זמניים (`neta@change.me` וכו׳). יש לעדכן להם מייל אמיתי במסך המשתמשים לפני שהם מתחברים.

## הרצה בשרת (Docker)

```bash
cp .env.example .env        # למלא סיסמאות, JWT_SECRET, ADMIN_EMAIL ו-SMTP
docker compose up -d --build
```

המערכת עולה בפורט `APP_PORT` (ברירת מחדל 80). nginx מגיש את ה-FrontEnd ומעביר את `/api` ל-BackEnd.
קבצי ה-SQL ב-`dataBase` רצים רק בהפעלה הראשונה של ה-volume. כדי לייבא מחדש: `docker compose down -v`.

## HTTPS (חובה כשהמערכת נגישה מהאינטרנט)

בלי HTTPS קוד הכניסה ועוגיית ההתחברות עוברים ברשת בטקסט גלוי.

1. מפנים דומיין לשרת, ומפיקים תעודה (למשל Let's Encrypt):
   ```bash
   sudo certbot certonly --standalone -d pm.your-domain.com
   mkdir -p certs
   sudo cp /etc/letsencrypt/live/pm.your-domain.com/{fullchain,privkey}.pem certs/
   ```
2. ב-`.env`: `FRONTEND_URL=https://pm.your-domain.com`
3. מריצים עם קובץ ה-HTTPS:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d --build
   ```

HTTP מופנה אוטומטית ל-HTTPS, ונשלחת כותרת HSTS. עוגיית ההתחברות מסומנת `Secure` אוטומטית כשהאתר ב-HTTPS.
אם ה-HTTPS כבר מטופל לפני השרת (Cloudflare, load balancer), אפשר להישאר עם `docker-compose.yml` הרגיל.

## אבטחה

- **התחברות:** קוד חד-פעמי למייל. הטוקן נשמר רק בעוגיית `httpOnly` + `SameSite=Strict` (לא נגיש ל-JavaScript). יציאה מבטלת את הטוקן בשרת (בכל המכשירים).
- **CSRF:** כל שינוי חייב כותרת `X-Requested-With`, שאתר זר לא יכול לשלוח (CORS חוסם).
- **SQL:** כל השאילתות עם פרמטרים. **קלט:** ניקוי HTML, בדיקת ערכים קבועים, תאריכים, מספרים ומיילים בשרת.
- **כותרות:** Helmet ב-API, ו-CSP / X-Frame-Options / nosniff ב-nginx (`FrontEnd/nginx/security-headers.conf`).
- **Rate limiting:** 1000 בקשות ל-15 דקות ל-API, 20 ניסיונות כניסה ל-15 דקות.
- **לוג אבטחה:** שורת JSON לכל אירוע (כניסה, קוד שגוי, חסימה, שינוי נתונים):
  ```bash
  docker logs pm-backend 2>&1 | grep '"type":"security"'
  ```
- **סודות:** השרת לא עולה אם `JWT_SECRET` חסר, קצר מ-32 תווים או נשאר ערך הדוגמה.

## הרצה מקומית לפיתוח

```bash
# MySQL מקומי
mysql -u root < dataBase/01-init.sql
mysql -u root < dataBase/02-seed.sql      # לא חובה

cd BackEnd && cp .env.example .env && npm install && npm run dev     # http://localhost:4000
cd FrontEnd && cp .env.example .env && npm install && npm run dev    # http://localhost:5173
```
