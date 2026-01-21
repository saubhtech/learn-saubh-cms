'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Lesson, Subject, Unit, Exam } from '@/types/database';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [formData, setFormData] = useState<Partial<Lesson>>({
    langid: 1,
    subjectid: 0,
    euserid: 1,
    lesson: '',
    content: '',
    lesson_doc: [],
    lesson_audio: [],
    lesson_video: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lr, sr, ur, er] = await Promise.all([
        fetch('/api/lessons').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/units').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
      ]);

      if (lr.success) setLessons(lr.data);
      if (sr.success) setSubjects(sr.data);
      if (ur.success) setUnits(ur.data);
      if (er.success) setExams(er.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const method = editingLesson ? 'PUT' : 'POST';
    const body = editingLesson ? { ...formData, lessonid: editingLesson.lessonid } : formData;

    const res = await fetch('/api/lessons', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message);
      setShowModal(false);
      loadData();
    } else {
      alert(data.error);
    }
  };

  const handleDelete = async (lessonid: number) => {
    if (!confirm('Delete this lesson?')) return;
    const res = await fetch(`/api/lessons?lessonid=${lessonid}&euserid=1`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) loadData();
  };

  const filteredUnits = units.filter(u => u.subjectid === formData.subjectid);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Lessons Management</h1>
          <p className="text-gray-600 mt-1">Manage lessons with multimedia support</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingLesson(null);
            setFormData({
              langid: 1,
              subjectid: 0,
              euserid: 1,
              lesson: '',
              content: '',
              lesson_doc: [],
              lesson_audio: [],
              lesson_video: []
            });
            setShowModal(true);
          }}
        >
          + Add Lesson
        </button>
      </div>

      <div className="card">
        {lessons.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No lessons found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Lesson</th><th>Subject</th><th>Unit</th><th>Exam</th><th>Marks</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.lessonid}>
                  <td>{l.lessonid}</td>
                  <td>{l.lesson}</td>
                  <td>{l.subject_name}</td>
                  <td>{l.unit_name}</td>
                  <td>{l.exam_name}</td>
                  <td>{l.marks_total ?? '—'}</td>
                  <td className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                      onClick={() => {
                        setEditingLesson(l);
                        setFormData({ ...l });
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="px-3 py-1 bg-red-100 text-red-700 rounded"
                      onClick={() => l.lessonid && handleDelete(l.lessonid)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 space-y-4">
            <h2 className="text-xl font-bold">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="form-label">Lesson *</label>
                <input className="form-input" required
                  value={formData.lesson || ''}
                  onChange={e => setFormData({ ...formData, lesson: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Subject *</label>
                <select className="form-input" required
                  value={formData.subjectid}
                  onChange={e => setFormData({ ...formData, subjectid: Number(e.target.value) })}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Unit</label>
                <select className="form-input"
                  value={formData.unitid || ''}
                  onChange={e => setFormData({ ...formData, unitid: Number(e.target.value) })}
                >
                  <option value="">Select Unit</option>
                  {filteredUnits.map(u => (
                    <option key={u.unitid} value={u.unitid}>{u.unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Content</label>
                <textarea className="form-textarea"
                  value={formData.content || ''}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingLesson ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>
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
