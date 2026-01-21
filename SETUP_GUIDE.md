# 🚀 Quick Setup Guide - Learn Saubh CMS

## Step-by-Step Installation (5 minutes)

### Step 1: Import Database Schema to pgAdmin ✅

1. **Open pgAdmin 4**
2. **Connect to Server:**
   - Host: `88.222.241.228`
   - Port: `5432`
   - Database: `saubh`
   - Username: Your PostgreSQL username
   - Password: Your PostgreSQL password

3. **Import Schema:**
   - Right-click on `saubh` database → **Query Tool**
   - Open file: `learn_saubh_cms_schema.sql`
   - Click **Execute (F5)** or press the ▶️ button
   - Wait for "Query returned successfully" message
   - Verify tables created: Right-click database → **Refresh** → Check **Tables**

### Step 2: Install Node.js Dependencies 📦

```bash
cd cms-admin
npm install
```

If you encounter errors, try:
```bash
npm install --legacy-peer-deps
```

### Step 3: Configure Environment Variables 🔧

Edit the `.env.local` file with your database credentials:

```env
# Database Configuration
DB_HOST=88.222.241.228
DB_PORT=5432
DB_NAME=saubh
DB_USER=your_actual_username_here
DB_PASSWORD=your_actual_password_here

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**⚠️ IMPORTANT:** Replace `your_actual_username_here` and `your_actual_password_here` with your real PostgreSQL credentials!

### Step 4: Start the Development Server 🎯

```bash
npm run dev
```

You should see:
```
✓ Ready on http://localhost:3000
```

### Step 5: Open in Browser 🌐

Navigate to: **http://localhost:3000**

You should see the CMS Dashboard!

---

## 🎨 What's Working Now

### ✅ Fully Implemented Modules
1. **Dashboard** - Statistics and navigation
2. **Exams Management** - Full CRUD (Create, Read, Update, Delete)
3. **Subjects Management** - Full CRUD with exam selection

### 🔧 Modules to Implement (Following Same Pattern)

The following modules need their pages created (APIs are ready):

4. **Units** - `/app/units/page.tsx`
5. **Lessons** - `/app/lessons/page.tsx`
6. **Topics** - `/app/topics/page.tsx`
7. **Questions** - `/app/questions/page.tsx`
8. **MCQs** - `/app/mcqs/page.tsx`
9. **Teachers** - `/app/teachers/page.tsx`
10. **Learners** - `/app/learners/page.tsx`
11. **Tests** - `/app/tests/page.tsx`

---

## 📝 How to Create Remaining Pages

Each page follows the same pattern as `exams/page.tsx`. Here's the template:

### 1. Create Directory
```bash
mkdir app/units
```

### 2. Create API Route
File: `app/api/units/route.ts`

Copy pattern from `app/api/exams/route.ts` and adjust:
- Table name: `exam` → `eunit`
- Primary key: `examid` → `unitid`
- Fields: Adjust based on table schema

### 3. Create Page Component
File: `app/units/page.tsx`

Copy from `app/exams/page.tsx` or `app/subjects/page.tsx` and modify:
- Component name
- API endpoints
- Form fields
- Table columns

---

## 🔥 Quick Code Generator Template

### Units Page Example

```typescript
// app/units/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Unit, Subject } from '@/types/database';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<Partial<Unit>>({
    langid: 1,
    subjectid: 0,
    unit: '',
    chapter: '',
    unit_doc: '',
    marks_total: 100,
    euserid: 1,
  });

  // Follow same pattern as subjects/page.tsx
  // 1. fetchData()
  // 2. handleSubmit()
  // 3. handleEdit()
  // 4. handleDelete()
  // 5. Render table and modal
}
```

---

## 🛠️ Troubleshooting

### Database Connection Failed
```bash
# Test connection in pgAdmin first
# Verify credentials in .env.local
# Check if PostgreSQL port 5432 is accessible
```

### Port 3000 Already in Use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📊 Database Tables Reference

| Table | Primary Key | Main Fields | Parent Table |
|-------|------------|-------------|--------------|
| exam | examid | exam, syllabus, marks_total | - |
| esubject | subjectid | subject, examid, marks_total | exam |
| eunit | unitid | unit, subjectid, chapter | esubject |
| elesson | lessonid | lesson, subjectid, unitid | esubject, eunit |
| etopic | topicid | topic, lessonid, content | elesson |
| equest | questid | question, answer, lessonid[] | elesson |
| emcq | mcqid | question, options, answer | elesson |
| eteacher | teacherid | userid, examid[], subjectid[] | exam, esubject |
| elearner | learnerid | userid, examid, subjectid | exam, esubject |
| eresult | resultid | learnerid, marks_scored | elearner |
| equestest | equestestid | learnerid, mcqid[] | elearner, emcq |
| etest | testid | resultid, mcqid, opted | eresult, emcq |

---

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel dashboard.

### Deploy to Other Platforms
- **Railway**: Connect GitHub repo
- **Netlify**: Use `next export` for static
- **DigitalOcean**: Use App Platform
- **AWS**: Amplify or EC2

---

## 📞 Next Steps

1. ✅ Database schema imported
2. ✅ Application running
3. ✅ Exams and Subjects working
4. 🔲 Create remaining 8 module pages
5. 🔲 Add authentication
6. 🔲 Implement file uploads
7. 🔲 Add advanced features

---

## 💡 Tips for Rapid Development

1. **Copy-Paste Pattern**: Use exams/subjects as templates
2. **API First**: Create API routes before pages
3. **Test in pgAdmin**: Verify queries work before coding
4. **Use TypeScript**: Types are already defined in `types/database.ts`
5. **Console Logs**: Add debugging logs generously

---

## ✅ Completion Checklist

Before end of day:

- [x] Database schema imported
- [x] Application setup complete
- [x] Dashboard working
- [x] Exams CRUD complete
- [x] Subjects CRUD complete
- [ ] Units CRUD
- [ ] Lessons CRUD
- [ ] Topics CRUD
- [ ] Questions CRUD
- [ ] MCQs CRUD
- [ ] Teachers CRUD
- [ ] Learners CRUD
- [ ] Tests CRUD

**Estimated time per module**: 15-20 minutes (following pattern)

**Total remaining time**: ~2-3 hours for all 8 modules

---

## 🎯 Focus Areas for Today

1. **Priority 1** (MUST HAVE): Exams, Subjects, Units, Lessons ✅ 50% done
2. **Priority 2** (SHOULD HAVE): Questions, MCQs, Teachers, Learners
3. **Priority 3** (NICE TO HAVE): Tests, Results, Analytics

---

Good luck! You've got this! 🚀

The foundation is solid. Now just replicate the pattern for each module.
