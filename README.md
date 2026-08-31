# 👑 Kaiser Management & VPN Bot System (v2.0)

پروژه کامل مدیریت اشتراک هوشمند و ربات فروش VPN بازنویسی شده با معماری مدرن:
- **فرانت‌اند (Frontend):** Angular 19 SPA با طراحی Dark Glassmorphism، نمودارهای Chart.js و فونت وزیرمتن (RTL).
- **بک‌اند (Backend):** C# .NET 8 Web API + Entity Framework Core متصل به پایگاه داده **PostgreSQL**.
- **ربات تلگرام (Telegram Bot):** Node.js (Telegraf) با ست شدن **خودکار وب‌هوک (Auto-Webhook)** در استارت‌آپ و قفل عضویت اجباری کانال `@namahdoodnet`.
- **وب‌سرور و Reverse Proxy:** NGINX جهت مسیریابی هوشمند ساب‌دامنه‌ها و ترافیک تلگرام/پنل.

---

## 🌐 تنظیمات ساب‌دامنه‌ها در Nginx

1. **🔗 ساب‌دامنه وب‌هوک و API ربات:**
   - **آدرس:** `https://botrohamapi.goodino24.ir`
   - **مسیر وب‌هوک ربات:** `https://botrohamapi.goodino24.ir/bot-webhook` (هدایت خودکار به `kaiser-bot:3000`)
   - **مسیرهای API و سابسکریپشن:** `https://botrohamapi.goodino24.ir/kaiser`, `/swagger`, `/api/*` (هدایت به `kaiser-backend:5000`)

2. **🖥️ ساب‌دامنه پنل وب مدیریت:**
   - **آدرس:** `https://botroham.goodino24.ir` (هدایت خودکار به `kaiser-frontend:80` برای نمایش اپلیکیشن انگولار)

---

## 🔑 اطلاعات ورود سوپر ادمین (Super Admin)

- **نام کاربری (Username):** `admin`
- **کلمه عبور (Password):** `kjhgfdsaMn01@`

---

## 🤖 مشخصات ربات تلگرام

- **توکن ربات:** `8528982981:AAEHHIKKqqF7mPzhAt9AxS7rph5rhd4qrPE`
- **کانال قفل عضویت اجباری:** `@namahdoodnet` (`https://t.me/namahdoodnet`)
- **وب‌هوک تلگرام:** با اجرای پروژه در داکر، ربات به طور خودکار آدرس `https://botrohamapi.goodino24.ir/bot-webhook` را در سرورهای تلگرام ست و تایید می‌کند (`setWebhook`).

---

## 🚀 نحوه کلون از گیت و اجرای خودکار با داکر (Production)

تنها با اجرای یک دستور، تمامی ایمیج‌ها از سورس پروژه بیلد شده و سرویس‌ها بالا می‌آیند:

```bash
# 1. کلون کردن سورس پروژه
git clone <URL_REPOSIOTRY>
cd Sohei_B

# 2. بیلد خودکار و اجرای کلیه کانتینرها
docker compose up -d --build
```

یا اجرای اسکریپت خودکار نصب:
```bash
chmod +x install.sh
./install.sh
```
