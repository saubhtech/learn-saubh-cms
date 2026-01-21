# Code Generator Templates for Remaining Modules

## Quick Copy-Paste Templates

Use these templates to quickly create the remaining modules. Just replace the placeholders:

- `{Table}` → Capitalized table name (e.g., "Unit", "Lesson")
- `{table}` → Lowercase table name (e.g., "unit", "lesson")
- `{tableid}` → Primary key field (e.g., "unitid", "lessonid")
- `{fields}` → Comma-separated fields

---

## Template 1: Simple CRUD Page (Units, Topics)

### File: `app/{table}s/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

interface {Table} {
  {tableid}?: number;
  langid: number;
  // Add other fields here
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export default function {Table}sPage() {
  const [items, setItems] = useState<{Table}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{Table} | null>(null);
  const [formData, setFormData] = useState<Partial<{Table}>>({
    langid: 1,
    // Initialize other fields
    euserid: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/{table}s');
      const data = await response.json();
      if (data.success) setItems(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/{table}s';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...formData, {tableid}: editing.{tableid} } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowModal(false);
        setEditing(null);
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      const response = await fetch(`/api/{table}s?{tableid}=${id}&euserid=1`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchData();
      }
    } catch (error) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{Table}s Management</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add New
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              {/* Add column headers */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.{tableid}}>
                <td>{item.{tableid}}</td>
                {/* Add data cells */}
                <td>
                  <button onClick={() => setEditing(item)} className="btn btn-sm btn-secondary mr-2">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.{tableid})} className="btn btn-sm btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editing ? 'Edit' : 'Add'} {Table}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Add form fields here */}
              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Template 2: API Route

### File: `app/api/{table}s/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM {table} WHERE del = false ORDER BY {tableid} DESC'
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { {fields}, euserid } = body;

    if (!euserid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO {table} ({fields}, euserid, edate, del)
       VALUES ($1, $2, ..., CURRENT_DATE, false)
       RETURNING *`,
      [{values}]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: '{Table} created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { {tableid}, {fields}, euserid } = body;

    if (!{tableid} || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    }

    const result = await query(
      `UPDATE {table} 
       SET {field1} = COALESCE($1, {field1}),
           {field2} = COALESCE($2, {field2}),
           euserid = $X,
           edate = CURRENT_DATE
       WHERE {tableid} = $Y AND del = false
       RETURNING *`,
      [{values}]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: '{Table} updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('{tableid}');
    const euserid = searchParams.get('euserid');

    const result = await query(
      'UPDATE {table} SET del = true, euserid = $1, edate = CURRENT_DATE WHERE {tableid} = $2',
      [euserid, id]
    );

    return NextResponse.json({ success: true, message: '{Table} deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## Specific Module Configurations

### Units
- Table: `eunit`
- ID: `unitid`
- Fields: `langid, subjectid, unit, chapter, unit_doc, marks_total`
- Parent: `esubject`

### Lessons
- Table: `elesson`
- ID: `lessonid`
- Fields: `langid, subjectid, unitid, lesson, content, topicid, lesson_doc, lesson_audio, lesson_video, marks_total`
- Parents: `esubject`, `eunit`
- Note: Arrays for multimedia

### Topics
- Table: `etopic`
- ID: `topicid`
- Fields: `langid, lessonid, topic, content, topic_doc, topic_audio, topic_video, marks_total`
- Parent: `elesson`

### Questions
- Table: `equest`
- ID: `questid`
- Fields: `langid, question, answer, lessonid, quest_doc, quest_audio, quest_video, marks`
- Note: lessonid is array

### MCQs
- Table: `emcq`
- ID: `mcqid`
- Fields: `langid, question, option1, option2, option3, option4, option5, answer, lessonid, mcq_doc, marks`
- Note: answer is integer (1-5)

### Teachers
- Table: `eteacher`
- ID: `teacherid`
- Fields: `userid, examid, subjectid, langid`
- Note: Arrays for assignments

### Learners
- Table: `elearner`
- ID: `learnerid`
- Fields: `userid, examid, subjectid`

### Tests
- Table: `etest`
- ID: `testid`
- Fields: `resultid, learnerid, mcqid, opted`

---

## Quick Start Commands

```bash
# Create new module directory
mkdir -p app/{table}s app/api/{table}s

# Copy template and customize
cp app/exams/page.tsx app/{table}s/page.tsx
cp app/api/exams/route.ts app/api/{table}s/route.ts

# Edit files (replace placeholders)
# Test in browser
```

---

## Testing Checklist

For each module:
- [ ] Can view list
- [ ] Can add new item
- [ ] Can edit item
- [ ] Can delete item
- [ ] Form validation works
- [ ] Error messages display
- [ ] Success messages display

---

## Estimated Time per Module

- API Route: 10 minutes
- Page Component: 15 minutes
- Testing: 5 minutes
- **Total: 30 minutes per module**

---

## Priority Order

1. **Units** ← Next
2. **Lessons**
3. **Topics**
4. **Questions**
5. **MCQs**
6. **Teachers**
7. **Learners**
8. **Tests**

Start with Units since Exams and Subjects are done!
