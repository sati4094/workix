# Quick Setup Guide - Fix Database Connection

## ✅ You've already completed:
- ✅ Installed dependencies (`npm install`)
- ✅ Created `.env` file

## 🔧 Current Issue: PostgreSQL Connection

The error shows PostgreSQL is installed but authentication is failing. Here's how to fix it:

---

## **Solution 1: Set Your PostgreSQL Password (RECOMMENDED)**

### Step 1: Find Your PostgreSQL Password
The password you set when you installed PostgreSQL. If you don't remember:

### Step 2: Open pgAdmin 4
1. Press **Windows Key**
2. Type: `pgAdmin`
3. Open **pgAdmin 4**
4. Enter your master password (set during PostgreSQL installation)

### Step 3: Create Database Using pgAdmin
1. In left panel, expand **Servers** → **PostgreSQL 16** (or your version)
2. Right-click on **Databases**
3. Select **Create** → **Database**
4. Name: `workix`
5. Click **Save**

### Step 4: Update .env File
1. Open: `D:\OneDrive\Apps\AIApps\workix\workix\backend\.env`
2. Find these lines:
   ```
   DB_USER=psath
   DB_PASSWORD=
   ```
3. Change to:
   ```
   DB_USER=postgres
   DB_PASSWORD=your_actual_password
   ```
   Replace `your_actual_password` with your PostgreSQL password

### Step 5: Run Migration Again
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run migrate
```

---

## **Solution 2: Use Command Line (Alternative)**

If you know your PostgreSQL password:

### Step 1: Add PostgreSQL to PATH
1. Find your PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\16\bin`)
2. Add to Windows PATH:
   - Right-click **This PC** → **Properties**
   - Click **Advanced system settings**
   - Click **Environment Variables**
   - Under System variables, select **Path**
   - Click **Edit**
   - Click **New**
   - Add: `C:\Program Files\PostgreSQL\16\bin` (adjust version number)
   - Click **OK** on all windows
3. **Close and reopen** PowerShell

### Step 2: Create Database
```powershell
# This will prompt for password
psql -U postgres -c "CREATE DATABASE workix;"
```

### Step 3: Update .env
```powershell
# Open .env and set:
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### Step 4: Run Migration
```powershell
npm run migrate
```

---

## **Solution 3: Use Default PostgreSQL User (Quickest)**

### If you installed PostgreSQL with default settings:

1. **Edit .env file**:
   ```
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

2. **Try migration**:
   ```powershell
   npm run migrate
   ```

---

## 🎯 After Successful Migration

You should see:
```
✅ Database migration completed successfully!
📝 Database tables created
🔧 Triggers and functions set up
👀 Views created
```

Then run:
```powershell
npm run seed
```

This adds demo users and data.

Finally, start the server:
```powershell
npm run dev
```

---

## 🐛 Still Having Issues?

### Check if PostgreSQL is Running:
1. Press **Windows + R**
2. Type: `services.msc`
3. Look for **postgresql-x64-16** (or your version)
4. Make sure **Status** is **Running**
5. If not, right-click → **Start**

### Check Connection Manually:

Using pgAdmin:
1. Open pgAdmin 4
2. If you can connect and see databases, PostgreSQL is working
3. The issue is just the password in your `.env` file

---

## 📞 Quick Test

After fixing the password, test the connection:

```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run migrate
```

If you see "✅ Database migration completed successfully!" - **YOU'RE DONE!** 🎉

Then proceed with:
```powershell
npm run seed
npm run dev
```

---

## 💡 Pro Tip

If you want to avoid password issues in development:
1. Use `postgres` as both username and password
2. This is what the `.env` file expects by default
3. **Never use this in production!**

---

**Need more help?** The most common issue is just the password. Find it, update `.env`, and you're good to go!

