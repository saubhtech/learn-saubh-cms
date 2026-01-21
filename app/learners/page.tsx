'use client';

import { useEffect, useState } from 'react';
import { Exam, Subject, Learner } from '@/types/database';

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Partial<Learner>>({
    userid: 1,
    langid: 1,
    examid: 0,
    subjectid: 0,
    euserid: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [learRes, exRes, subRes] = await Promise.all([
        fetch('/api/learners'),
        fetch('/api/exams'),
        fetch('/api/subjects'),
      ]);

      const learData = await learRes.json();
      const examData = await exRes.json();
      const subjData = await subRes.json();

      if (learData.success) setLearners(learData.data);
      if (examData.success) setExams(examData.data);
      if (subjData.success) setSubjects(subjData.data);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      userid: 1,
      langid: 1,
      examid: 0,
      subjectid: 0,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, learnerid: editing.learnerid } : form;

    const r = await fetch('/api/learners', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();

    if (d.success) {
      alert(d.message);
      setShowModal(false);
      setEditing(null);
      loadData();
    } else alert(d.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete learner?')) return;
    const r = await fetch(`/api/learners?learnerid=${id}&euserid=1`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) loadData();
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Learners Management</h1>
          <p className="text-gray-500 mt-1">Enroll learners in exams and subjects</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ Add New Learner</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Exam</th>
              <th>Subject</th>
              <th>Lang</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {learners.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">No learners found.</td>
              </tr>
            ) : (
              learners.map(l => (
                <tr key={l.learnerid}>
                  <td>{l.learnerid}</td>
                  <td>User-{l.userid}</td>
                  <td>{l.exam_name ?? l.examid}</td>
                  <td>{l.subject_name ?? l.subjectid}</td>
                  <td>{l.langid}</td>
                  <td className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded"
                      onClick={() => { setEditing(l); setForm(l); setShowModal(true); }}>
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded"
                      onClick={() => handleDelete(l.learnerid!)}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Edit Learner' : 'Add Learner'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="form-label">Exam</label>
                <select
                  className="form-select"
                  value={form.examid}
                  onChange={e => setForm({ ...form, examid: Number(e.target.value) })}
                >
                  <option value="">Select Exam</option>
                  {exams.map(e => <option key={e.examid} value={e.examid}>{e.exam}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={form.subjectid}
                  onChange={e => setForm({ ...form, subjectid: Number(e.target.value) })}
                >
                  <option value="">Select Subject</option>
                  {subjects.filter(s => s.examid === form.examid)
                    .map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Language ID</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.langid}
                  onChange={e => setForm({ ...form, langid: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Save
                </button>
                <button type="button" className="btn btn-secondary flex-1"
                  onClick={() => setShowModal(false)}>
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
