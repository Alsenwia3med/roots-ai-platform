# 🚀 دليل نشر مشروع ROOTS-AI Platform

## 📋 خطوات إكمال النشر (يجب تنفيذها بنفسك)

### الخطوة 1: تشغيل قاعدة البيانات في Supabase

**اذهب إلى:** https://bunajhqggvvhjzsapwka.supabase.co

1. **من القائمة الجانبية**، اختر **SQL Editor** (أو 📝 SQL Editor)
2. **انقر على "New query"**
3. **افتح الملف التالي في جهازك:**
   ```
   C:\Users\user\Desktop\works\2026\RootsAi\roots-ai-platform\supabase\roots_ai_complete.sql
   ```
4. **انسخ كل محتوى الملف** (CTRL+A ثم CTRL+C)
5. **الصقه في SQL Editor** في Supabase (CTRL+V)
6. **اضغط Run** (أو CTRL+Enter)
7. **انتظر حتى ينتهي التنفيذ** (قد يستغرق 30-60 ثانية)
8. **تأكد من عدم وجود أخطاء** (should show "Success")

**ما سيحدث:**
- إنشاء 9 جداول (profiles, assessments, responses, scores, reports, audit_logs, consents, research_exports)
- تفعيل Row Level Security (RLS)
- إنشاء policies للحماية
- إنشاء role خاص للـ AI (roots_ai_narrative)

---

### الخطوة 2: إعداد البريد الإلكتروني في Supabase

**اذهب إلى:** https://bunajhqggvvhjzsapwka.supabase.co

1. **من القائمة الجانبية**، اختر **Authentication**
2. **اضغط على Providers**
3. **اضغط على Email Provider**
4. **اختر:** "Send emails with Supabase" (الخيار المجاني)
5. **اذهب إلى URL Configuration:**
   - **Site URL:** `https://roots-ai-platform.vercel.app`
   - **Redirect URLs:** أضف `https://roots-ai-platform.vercel.app/auth/callback`
6. **اذهب إلى Email Templates** واختر Confirm signup
7. **احفظ التغييرات**

**ملاحظة:** إذا أردت استخدام SMTP خاص بك، املأ البيانات في قسم SMTP.

---

### الخطوة 3: التأكد من Environment Variables في Vercel

**اذهب إلى:** https://vercel.com/roots-ai-platform/roots-ai-platform

1. **من القائمة الجانبية**، اختر **Settings**
2. **اضغط على Environment Variables**
3. **تأكد من وجود المتغيرين التاليين:**

**المتغير الأول:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://bunajhqggvvhjzsapwka.supabase.co`
- **Environment:** Production, Preview, Development
- اضغط **Save**

**المتغير الثاني:**
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_87fs_shBVSKfjyQdt_tidw_Dzsax5Ek`
- **Environment:** Production, Preview, Development
- اضغط **Save**

**إذا لم تكن موجودة، أضفها!**

---

### الخطوة 4: إعادة نشر المشروع في Vercel

**اذهب إلى:** https://vercel.com/roots-ai-platform/roots-ai-platform

1. **من القائمة الجانبية**، اختر **Deployments**
2. **اضغط على أحدث deployment**
3. **اضغط على زر Redeploy** (عادة في أعلى الصفحة أو بجانب الـ deployment)
4. **اختر Redeploy to Production**
5. **انتظر 2-3 دقائق** حتى ينتهي البناء والنشر
6. **تأكد من أن الحالة هي "Ready"**

---

### الخطوة 5: التحقق من الموقع المنشور

1. **افتح المتصفح على:** https://roots-ai-platform.vercel.app
2. **اختبر الصفحة الرئيسية** - يجب أن ترى:
   - Header مع logo
   - Hero section "Decode the Biology Before You Fight the Weight"
   - Biological Network diagram
   - 6 cards (What changes)
   - One biological intelligence framework
   - How it works (4 steps)
   - Example report preview
   - Pilot program section
   - Footer

3. **اختبر التنقل:**
   - How It Works (/how-it-works)
   - Platform (/platform)
   - Example Report (/example-report)
   - Research (/research)
   - About (/about)
   - More menu

4. **اختبر نظام Assessment:**
   - اضغط "Start Your Assessment"
   - املأ بريدك الإلكتروني
   - اضغط "Send magic link"
   - تحقق من بريدك الإلكتروني
   - اضغط على الرابط في البريد
   - أجب على الأسئلة (73 سؤال عبر 13 وحدة)
   - اضغط Submit
   - شاهد التقرير

---

## 🔍 التحقق من نجاح كل خطوة

### ✅ قاعدة البيانات:
- اذهب إلى Supabase → Table Editor
- يجب أن ترى 9 جداول
- جرب إضافة صف في جدول profiles للتأكد

### ✅ البريد الإلكتروني:
- جرب تسجيل الدخول
- يجب أن تصلك رسالة في بريدك الإلكتروني

### ✅ Vercel:
- اذهب إلى Deployments
- آخر deployment يجب أن يكون "Ready"
- اضغط على الرابط لفتح الموقع

### ✅ الموقع:
- الصفحة الرئيسية تعمل
- كل الروابط تعمل
- نظام Assessment يعمل

---

## 📝 معلومات مهمة

### بيانات Supabase:
- **Project URL:** https://bunajhqggvvhjzsapwka.supabase.co
- **Anon Key:** sb_publishable_87fs_shBVSKfjyQdt_tidw_Dzsax5Ek

### بيانات GitHub:
- **Repository:** https://github.com/Alsenwia3med/roots-ai-platform
- **Branch:** main

### بيانات Vercel:
- **Project:** roots-ai-platform
- **URL:** https://roots-ai-platform.vercel.app

---

## 🆘 إذا واجهت مشاكل

### خطأ في قاعدة البيانات:
- تأكد من نسخ كل محتوى الملف SQL
- تأكد من عدم وجود أخطاء في Console
- جرب إعادة تشغيل الاستعلام

### خطأ في البريد الإلكتروني:
- تأكد من إعداد Email Provider في Supabase
- تأكد من Site URL و Redirect URLs صحيحة
- تحقق من البريد في Spam/Junk

### خطأ في Vercel:
- تأكد من Environment Variables موجودة
- تأكد من القيم صحيحة
- حاول Redeploy مرة أخرى

### خطأ في الموقع:
- افتح Developer Tools (F12)
- تحقق من Console للأخطاء
- تحقق من Network للـ failed requests

---

## ✅ قائمة التحقق النهائية

- [ ] قاعدة البيانات تم تشغيلها في Supabase
- [ ] البريد الإلكتروني تم إعداده في Supabase
- [ ] Environment Variables موجودة في Vercel
- [ ] المشروع تم إعادة نشره في Vercel
- [ ] الصفحة الرئيسية تعمل
- [ ] كل الروابط تعمل
- [ ] نظام Assessment يعمل
- [ ] البريد الإلكتروني يصل
- [ ] التقرير يُنشأ بنجاح

---

**بعد إكمال كل الخطوات، الموقع سيكون مطابقاً 100% للموقع الأصلي roots-ai.health!** 🎉
