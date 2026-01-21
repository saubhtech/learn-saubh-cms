'use client';

import { useEffect, useState } from 'react';
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
    unitid: undefined,
    lesson: '',
    content: '',
    lesson_doc: [],
    lesson_audio: [],
    lesson_video: [],
    marks_total: undefined,
    euserid: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lessonRes, subjectRes, unitRes, examRes] = await Promise.all([
        fetch('/api/lessons'),
        fetch('/api/subjects'),
        fetch('/api/units'),
        fetch('/api/exams'),
      ]);

      const lr = await lessonRes.json();
      const sr = await subjectRes.json();
      const ur = await unitRes.json();
      const er = await examRes.json();

      if (lr.success) setLessons(lr.data);
      if (sr.success) setSubjects(sr.data);
      if (ur.success) setUnits(ur.data);
      if (er.success) setExams(er.data);

    } catch (e) {
      console.error(e);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingLesson(null);
    setFormData({
      langid: 1,
      subjectid: 0,
      unitid: undefined,
      lesson: '',
      content: '',
      lesson_doc: [],
      lesson_audio: [],
      lesson_video: [],
      marks_total: undefined,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingLesson ? 'PUT' : 'POST';
    const body = editingLesson ? { ...formData, lessonid: editingLesson.lessonid } : formData;

    try {
      const res = await fetch('/api/lessons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowModal(false);
        setEditingLesson(null);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Save failed');
    }
  };

  const handleDelete = async (lessonid: number) => {
    if (!confirm('Delete this lesson?')) return;
    const res = await fetch(`/api/lessons?lessonid=${lessonid}&euserid=1`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) loadData();
  };

  const filteredUnits = units.filter(u => u.subjectid === formData.subjectid);

  const addToArrayField = (field: 'lesson_doc' | 'lesson_audio' | 'lesson_video') => {
    const arr = [...(formData[field] || [])];
    arr.push('');
    setFormData({ ...formData, [field]: arr });
  };

  const updateArrayField = (field: 'lesson_doc' | 'lesson_audio' | 'lesson_video', idx: number, value: string) => {
    const arr = [...(formData[field] || [])];
    arr[idx] = value;
    setFormData({ ...formData, [field]: arr });
  };

  const removeArrayField = (field: 'lesson_doc' | 'lesson_audio' | 'lesson_video', idx: number) => {
    const arr = [...(formData[field] || [])];
    arr.splice(idx, 1);
    setFormData({ ...formData, [field]: arr });
  };

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
          <p className="text-gray-600 mt-1">Manage lessons with multimedia support (documents, audio, video)</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">+ Add New Lesson</button>
      </div>

      <div className="card">
        {lessons.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No lessons found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lesson</th>
                <th>Subject</th>
                <th>Unit</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Actions</th>
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
                  <td>{l.marks_total || '—'}</td>
                  <td className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded" onClick={() => {
                      setEditingLesson(l);
                      setFormData({ ...l });
                      setShowModal(true);
                    }}>Edit</button>
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded" onClick={() => handleDelete(l.lessonid)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="form-label">Lesson Name *</label>
                <input className="form-input" value={formData.lesson || ''} onChange={(e) => setFormData({ ...formData, lesson: e.target.value })} required />
              </div>

              <div>
                <label className="form-label">Subject *</label>
                <select
                  className="form-input"
                  value={formData.subjectid || ''}
                  onChange={(e) => setFormData({ ...formData, subjectid: parseInt(e.target.value) })}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Unit</label>
                <select
                  className="form-input"
                  value={formData.unitid || ''}
                  onChange={(e) => setFormData({ ...formData, unitid: parseInt(e.target.value) })}
                >
                  <option value="">Select Unit</option>
                  {filteredUnits.map(u => (
                    <option key={u.unitid} value={u.unitid}>{u.unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Content</label>
                <textarea className="form-textarea" rows={4} value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Marks Total</label>
                <input type="number" className="form-input" value={formData.marks_total || ''} onChange={(e) => setFormData({ ...formData, marks_total: parseInt(e.target.value) })} />
              </div>

              {['lesson_doc', 'lesson_audio', 'lesson_video'].map(field => (
                <div key={field}>
                  <label className="form-label capitalize">{field.replace('_', ' ')}</label>
                  {(formData[field as keyof Lesson] as string[] || []).map((v, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input className="form-input" value={v} onChange={(e) => updateArrayField(field as any, idx, e.target.value)} placeholder="https://..." />
                      <button type="button" className="btn btn-danger" onClick={() => removeArrayField(field as any, idx)}>x</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addToArrayField(field as any)}>+ Add</button>
                </div>
              ))}

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
