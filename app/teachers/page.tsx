'use client';

import { useEffect, useState } from 'react';
import { Teacher, Exam, Subject } from '@/types/database';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [form, setForm] = useState<Partial<Teacher>>({
    userid: 1,
    langid: [1],
    examid: 0,
    subjectid: 0,
    euserid: 1,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [t, e, s] = await Promise.all([
      fetch('/api/teachers').then(r => r.json()),
      fetch('/api/exams').then(r => r.json()),
      fetch('/api/subjects').then(r => r.json()),
    ]);

    if (t.success) setTeachers(t.data);
    if (e.success) setExams(e.data);
    if (s.success) setSubjects(s.data);
  };

  const reset = () => setForm({ userid: 1, langid: [1], examid: 0, subjectid: 0, euserid: 1 });

  const openAdd = () => {
    setEditing(null);
    reset();
    setShowModal(true);
  };

  const submit = async () => {
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, teacherid: editing.teacherid } : form;

    const res = await fetch('/api/teachers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json());

    if (res.success) {
      setShowModal(false);
      load();
    } else alert(res.error);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this teacher?')) return;
    await fetch(`/api/teachers?teacherid=${id}&euserid=1`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teachers Management</h1>
          <p className="text-gray-600 mt-1">Assign teachers to exams and subjects</p>
        </div>

        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <span className="text-xl">+</span> Add Teacher
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Languages</th>
              <th>Exam</th>
              <th>Subject</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No teachers found.
                </td>
              </tr>
            ) : (
              teachers.map(t => (
                <tr key={t.teacherid}>
                  <td>{t.teacherid}</td>
                  <td>{t.userid}</td>
                  <td>{t.langid.join(', ')}</td>
                  <td>{t.exam_name}</td>
                  <td>{t.subject_name}</td>
                  <td className="flex gap-2">
                    <button onClick={() => setEditing(t)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                      Edit
                    </button>
                    <button onClick={() => remove(t.teacherid!)} className="px-3 py-1 bg-red-100 text-red-700 rounded">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Teacher' : 'Assign Teacher'}</h2>

            <label className="form-label">User ID</label>
            <input className="form-input" type="number" value={form.userid}
              onChange={e => setForm({ ...form, userid: parseInt(e.target.value) })} />

            <label className="form-label mt-3">Languages</label>
            <input className="form-input" value={form.langid!.join(',')}
              onChange={e => setForm({ ...form, langid: e.target.value.split(',').map(Number) })} />

            <label className="form-label mt-3">Exam</label>
            <select className="form-input" value={form.examid}
              onChange={e => setForm({ ...form, examid: parseInt(e.target.value) })}>
              <option value="">Select Exam</option>
              {exams.map(e => <option key={e.examid} value={e.examid}>{e.exam}</option>)}
            </select>

            <label className="form-label mt-3">Subject</label>
            <select className="form-input" value={form.subjectid}
              onChange={e => setForm({ ...form, subjectid: parseInt(e.target.value) })}>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
            </select>

            <div className="flex gap-3 mt-6">
              <button onClick={submit} className="btn btn-primary flex-1">
                {editing ? 'Update' : 'Save'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
