'use client';

import { useEffect, useState } from 'react';
import { Exam } from '@/types/database';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState<Partial<Exam>>({
    langid: 1, // DB expects numeric (we will map language to numeric later if needed)
    language: 'English',
    exam: '',
    syllabus: '',
    exam_doc: '',
    marks_total: 100,
    euserid: 1,
  });

  const languageOptions = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali'];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      const data = await response.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      alert('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingExam(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      langid: 1,
      language: 'English',
      exam: '',
      syllabus: '',
      exam_doc: '',
      marks_total: 100,
      euserid: 1,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingExam ? 'PUT' : 'POST';
    const body = editingExam
      ? { ...formData, examid: editingExam.examid }
      : formData;

    const response = await fetch('/api/exams', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      setShowModal(false);
      setEditingExam(null);
      resetForm();
      fetchExams();
    } else {
      alert(data.error || 'Error');
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      language: exam.language || 'English',
      exam: exam.exam,
      syllabus: exam.syllabus || '',
      exam_doc: exam.exam_doc || '',
      marks_total: exam.marks_total || 100,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete exam?')) return;

    const res = await fetch(`/api/exams?examid=${id}&euserid=1`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchExams();
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Exams Management</h1>
          <p className="text-gray-600">Manage examination records</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <span className="text-xl">+</span> Add Exam
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Exam</th>
                <th>Language</th>
                <th>Total Marks</th>
                <th>Syllabus</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6">No exams found</td></tr>
              ) : (
                exams.map(ex => (
                  <tr key={ex.examid}>
                    <td>{ex.examid}</td>
                    <td>{ex.exam}</td>
                    <td>{ex.language}</td>
                    <td>{ex.marks_total}</td>
                    <td className="truncate max-w-xs">{ex.syllabus || '—'}</td>
                    <td className="flex gap-2">
                      <button onClick={() => handleEdit(ex)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">Edit</button>
                      <button onClick={() => handleDelete(ex.examid!)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
            
            {/* ❌ Cross Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 text-gray-600 hover:text-black text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">{editingExam ? 'Edit Exam' : 'Add Exam'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="form-label">Language *</label>
                <select
                  className="form-select"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  {languageOptions.map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Exam Name *</label>
                <input
                  className="form-input"
                  required
                  value={formData.exam}
                  onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Total Marks</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.marks_total}
                  onChange={(e) => setFormData({ ...formData, marks_total: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label">Syllabus</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                {editingExam ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
