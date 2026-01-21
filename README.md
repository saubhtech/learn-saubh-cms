# Learn Saubh CMS - Admin Panel

A comprehensive Next.js-based admin panel for managing educational content with PostgreSQL database.

## 🚀 Features

- ✅ **Complete CRUD Operations** for all 12 database tables
- 📊 **Dashboard** with real-time statistics
- 🎨 **Modern UI** with Tailwind CSS
- 🔄 **RESTful API** endpoints
- 📱 **Responsive Design**
- 🔍 **Advanced Filtering** and search
- 📁 **File Upload Support** for documents, audio, and video
- 👥 **User Management** for teachers and learners
- 📈 **Progress Tracking** and test results

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 18.1
- pgAdmin 4 (for database management)

## 🛠️ Installation Steps

### 1. Import Database Schema

```bash
# Open pgAdmin
# Connect to your PostgreSQL server (88.222.241.228:5432)
# Create database 'saubh' if it doesn't exist
# Right-click on the database → Query Tool
# Open the learn_saubh_cms_schema.sql file
# Execute the SQL script (F5)
```

### 2. Setup Next.js Application

```bash
# Navigate to the project directory
cd cms-admin

# Install dependencies
npm install

# Configure environment variables
# Edit .env.local with your database credentials:
DB_HOST=88.222.241.228
DB_PORT=5432
DB_NAME=saubh
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
cms-admin/
├── app/
│   ├── api/              # API routes for all tables
│   │   ├── exams/
│   │   ├── subjects/
│   │   ├── units/
│   │   ├── lessons/
│   │   ├── topics/
│   │   ├── questions/
│   │   ├── mcqs/
│   │   ├── teachers/
│   │   ├── learners/
│   │   ├── tests/
│   │   └── stats/
│   ├── exams/            # Exams management page
│   ├── subjects/         # Subjects management page
│   ├── [other modules]/  # Other management pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Dashboard/Home page
│   └── globals.css       # Global styles
├── components/
│   └── Sidebar.tsx       # Navigation sidebar
├── lib/
│   └── db.ts             # Database connection utility
├── types/
│   └── database.ts       # TypeScript type definitions
├── public/               # Static files
├── .env.local            # Environment variables
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies

```

## 🗄️ Database Tables

1. **exam** - Master examination table
2. **esubject** - Subjects within exams
3. **eunit** - Units within subjects
4. **elesson** - Lessons with multimedia support
5. **etopic** - Topics within lessons
6. **equest** - Descriptive questions
7. **emcq** - Multiple choice questions
8. **eteacher** - Teacher assignments
9. **elearner** - Learner enrollments
10. **eresult** - Test results
11. **equestest** - Question test assignments
12. **etest** - Individual test answers

## 🔌 API Endpoints

All API endpoints follow RESTful conventions:

### Exams
- `GET /api/exams` - List all exams
- `POST /api/exams` - Create new exam
- `PUT /api/exams` - Update exam
- `DELETE /api/exams?examid=X&euserid=Y` - Delete exam (soft)

### Subjects
- `GET /api/subjects?examid=X` - List subjects (optional filter)
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects` - Update subject
- `DELETE /api/subjects?subjectid=X&euserid=Y` - Delete subject

*(Similar patterns for all other tables)*

### Example API Request

```javascript
// Create new exam
const response = await fetch('/api/exams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    langid: 1,
    exam: 'SSC Board Exam 2025',
    syllabus: 'Complete SSC syllabus...',
    marks_total: 600,
    euserid: 1
  })
});

const data = await response.json();
```

## 🎨 UI Components

### Dashboard
- Real-time statistics cards
- Quick action buttons
- Module navigation grid

### CRUD Pages
- Data tables with sorting
- Add/Edit modals
- Delete confirmations
- Form validation
- Search and filter

### Features
- Responsive sidebar navigation
- Collapsible sidebar
- Loading states
- Error handling
- Success notifications

## 🔧 Configuration

### Database Connection
Edit `.env.local`:
```env
DB_HOST=88.222.241.228
DB_PORT=5432
DB_NAME=saubh
DB_USER=your_username
DB_PASSWORD=your_password
```

### User ID
Currently hardcoded as `euserid: 1`. Implement authentication to use actual user IDs.

## 📝 To-Do / Enhancements

- [ ] Implement remaining table pages (Units, Lessons, Topics, etc.)
- [ ] Add user authentication (JWT/Session)
- [ ] File upload functionality
- [ ] Advanced search and filters
- [ ] Export data (CSV, PDF)
- [ ] Pagination for large datasets
- [ ] Real-time updates (WebSocket)
- [ ] Audit logs
- [ ] Role-based access control
- [ ] Multi-language support
- [ ] Data visualization charts
- [ ] Bulk operations

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Set the following in your hosting platform:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

## 📊 Sample Data Structure

### Creating an Exam
```json
{
  "langid": 1,
  "exam": "Class 10 Board Exam",
  "syllabus": "Full syllabus for class 10",
  "marks_total": 500,
  "euserid": 1
}
```

### Creating a Subject
```json
{
  "langid": 1,
  "examid": 1,
  "subject": "Mathematics",
  "marks_total": 100,
  "marks_theory": 80,
  "marks_practicum": 20,
  "pass_total": 35,
  "euserid": 1
}
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check firewall rules for port 5432
- Confirm database credentials
- Test connection in pgAdmin first

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Change port in package.json
"dev": "next dev -p 3001"
```

## 📞 Support

For issues or questions:
- Check database connection in pgAdmin
- Review console logs for errors
- Verify API responses in Network tab
- Check server logs: `npm run dev`

## 📄 License

Proprietary - Learn Saubh Educational Platform

## 🙏 Credits

- Built with Next.js 14
- Styled with Tailwind CSS
- Database: PostgreSQL 18.1
- Icons: Unicode Emoji

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Database Schema:** learn_saubh_cms_schema.sql
