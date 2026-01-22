'use client';

import { useEffect, useState } from 'react';
import { Exam, Subject, Learner } from '@/types/database';

interface Language {
  langid: number;
  lang_name: string;
}

export default function LearnersPage() {
  const [learners, setLearners] = useState<any[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Partial<Learner>>({
    userid: 1,
    langid: 0,
    examid: 0,
    subjectid: 0,
    euserid: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [learRes, exRes, subRes, langRes] = await Promise.all([
        fetch('/api/learners'),
        fetch('/api/exams'),
        fetch('/api/subjects'),
        fetch('/api/language'),
      ]);

      const learData = await learRes.json();
      const examData = await exRes.json();
      const subjData = await subRes.json();
      const langData = await langRes.json();

      console.log('Languages:', langData); // Debug
      console.log('Exams:', examData); // Debug
      console.log('Subjects:', subjData); // Debug

      if (learData.success) setLearners(learData.data);
      if (examData.success) setExams(examData.data);
      if (subjData.success) setSubjects(subjData.data);
      if (langData.success) setLanguages(langData.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      userid: 1,
      langid: 0,
      examid: 0,
      subjectid: 0,
      euserid: 1,
    });
  };

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.userid || !form.langid || !form.examid || !form.subjectid) {
      alert('Please fill all required fields');
      return;
    }

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, learnerid: editing.learnerid } : form;

    try {
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
        resetForm();
        loadData();
      } else {
        alert(d.error || 'Error saving learner');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save learner');
    }
  };

  const handleEdit = (learner: any) => {
    setEditing(learner);
    setForm({
      userid: learner.userid,
      langid: learner.langid,
      examid: learner.examid,
      subjectid: learner.subjectid,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this learner enrollment?')) return;

    try {
      const r = await fetch(`/api/learners?learnerid=${id}&euserid=1`, {
        method: 'DELETE',
      });
      const d = await r.json();

      if (d.success) {
        alert(d.message);
        loadData();
      } else {
        alert(d.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete learner');
    }
  };

  // Get filtered subjects based on selected exam
  const getFilteredSubjects = () => {
    if (!form.examid) return [];
    return subjects.filter((s) => s.examid === form.examid);
  };

  const filteredSubjects = getFilteredSubjects();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Learners Management</h1>
          <p className="text-gray-600 mt-1">Enroll learners in exams and subjects</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <span className="text-xl">+</span>
          Add New Learner
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Language</th>
                <th>Exam</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No learners found. Click "Add New Learner" to enroll one.
                  </td>
                </tr>
              ) : (
                learners.map((l) => (
                  <tr key={l.learnerid}>
                    <td className="font-medium">{l.learnerid}</td>
                    <td>{l.userid}</td>
                    <td>{l.lang_name || `Lang ${l.langid}`}</td>
                    <td>{l.exam_name || `Exam ${l.examid}`}</td>
                    <td>{l.subject_name || `Subject ${l.subjectid}`}</td>
                    <td className="text-sm text-gray-500">
                      {l.edate ? new Date(l.edate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          onClick={() => handleEdit(l)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          onClick={() => handleDelete(l.learnerid)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                setEditing(null);
                resetForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              type="button"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {editing ? 'Edit Learner Enrollment' : 'Enroll New Learner'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User ID */}
              <div>
                <label className="form-label">User ID *</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.userid}
                  onChange={(e) => setForm({ ...form, userid: Number(e.target.value) })}
                  required
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Reference to the user in your authentication system
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="form-label">Language *</label>
                {languages.length === 0 ? (
                  <p className="text-sm text-red-600 p-3 bg-red-50 rounded">
                    ⚠️ No languages available. Please add languages first in the database.
                  </p>
                ) : (
                  <select
                    className="form-select"
                    value={form.langid || ''}
                    onChange={(e) => setForm({ ...form, langid: Number(e.target.value) })}
                    required
                  >
                    <option value="">Select Language</option>
                    {languages.map((lang) => (
                      <option key={lang.langid} value={lang.langid}>
                        {lang.lang_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Exam */}
              <div>
                <label className="form-label">Exam *</label>
                {exams.length === 0 ? (
                  <p className="text-sm text-red-600 p-3 bg-red-50 rounded">
                    ⚠️ No exams available. Please add exams first.
                  </p>
                ) : (
                  <select
                    className="form-select"
                    value={form.examid || ''}
                    onChange={(e) => {
                      const newExamId = Number(e.target.value);
                      setForm({ 
                        ...form, 
                        examid: newExamId,
                        subjectid: 0  // Reset subject when exam changes
                      });
                    }}
                    required
                  >
                    <option value="">Select Exam</option>
                    {exams.map((e) => (
                      <option key={e.examid} value={e.examid}>
                        {e.exam}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject (filtered by selected exam) */}
              <div>
                <label className="form-label">Subject *</label>
                {!form.examid ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ℹ️ Please select an exam first
                  </div>
                ) : filteredSubjects.length === 0 ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    ⚠️ No subjects found for this exam. Please add subjects first.
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={form.subjectid || ''}
                    onChange={(e) => setForm({ ...form, subjectid: Number(e.target.value) })}
                    required
                    disabled={!form.examid}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.subjectid} value={s.subjectid}>
                        {s.subject}
                      </option>
                    ))}
                  </select>
                )}
                {form.examid && filteredSubjects.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredSubjects.length} subject(s) available for selected exam
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={!form.langid || !form.examid || !form.subjectid}
                >
                  {editing ? 'Update Enrollment' : 'Enroll Learner'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    resetForm();
                  }}
                >
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