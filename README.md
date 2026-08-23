# חשב לי (mahdhevon)

אפליקציית מחשבונים ישראלית בעברית וב־RTL, מבוססת React 19, Vite, Tailwind CSS ו־Supabase.

## הפעלה מקומית

1. העתיקו את `.env.example` אל `.env.local` והגדירו ערכי Supabase.
2. הריצו `npm install` ואז `npm run dev`.
3. בדיקות: `npm test`, בדיקת טיפוסים: `npm run typecheck`, build: `npm run build`.

## אבטחה ופריסה

- `VITE_ADMIN_EMAILS` מציג את ממשק הניהול בלבד. הרשאה אמיתית נאכפת ב־Edge Functions בעזרת secret בשם `ADMIN_EMAILS`.
- אין לחשוף service-role או secrets במשתני `VITE_*`.
- לאחר שינוי Edge Functions יש לפרוס אותן ולהגדיר את ה־secrets מהדוגמה.

## תמונות מחשבונים עם xAI

- יצירה: `set -a; source supabase/.env.local; set +a; npm run images:generate`.
- הסקריפט יוצר רק נכסים חסרים; `--force` מחליף טיוטות קיימות.
- כל תמונה נשמרת תחת `public/assets/calculators` ונרשמת ב־manifest עם checksum, עלות ומצב אישור.
- אין לפרסם נכס שמצבו `draft` לפני בדיקה אנושית.

## Telegram

1. צרו בוט אצל BotFather ושמרו את `TELEGRAM_BOT_TOKEN` כ־Supabase secret.
2. הגדירו `TELEGRAM_CHAT_ID` או שמרו Chat ID במסך ספקים ב־CRM.
3. לחצו “שלח בדיקה”. הבדיקה מפעילה `getMe` ו־`sendMessage` ומחזירה שגיאת Telegram מפורטת.
4. עבור webhook הגדירו `TELEGRAM_WEBHOOK_SECRET` ושלחו אותו כ־`secret_token` בעת `setWebhook`.

## דיוק פיננסי

התוצאות הן אומדנים בלבד. כל מחשבון מציג תאריך עדכון ומקור; אין להציג נתוני שנה קודמת כנתונים עדכניים בלי אימות מול רשות המסים, ביטוח לאומי או מקור ממשלתי מתאים.
