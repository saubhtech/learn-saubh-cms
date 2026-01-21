'use client';

import { useEffect, useState } from 'react';
import { Question, Lesson } from '@/types/database';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const [formData, setFormData] = useState<Partial<Question>>({
    langid: 1,
    lessonid: [],
    question: '',
    quest_doc: '',
    answer: '',
    answer_doc: '',
    explain: '',
    euserid: 1,
  });

  useEffect(() => {
    fetchQuestions();
    fetchLessons();
  }, []);

  const fetchQuestions = async () => {
    const r = await fetch('/api/questions');
    const d = await r.json();
    if (d.success) setQuestions(d.data);
  };

  const fetchLessons = async () => {
    const r = await fetch('/api/lessons');
    const d = await r.json();
    if (d.success) setLessons(d.data);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...formData, questid: editing.questid } : formData;

    const r = await fetch(`/api/questions`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const d = await r.json();
    if (d.success) {
      close();
      fetchQuestions();
    } else {
      alert(d.error);
    }
  };

  const del = async (id: number | undefined) => {
    if (!id) return;
    if (!confirm('Delete?')) return;
    const r = await fetch(`/api/questions?questid=${id}&euserid=1`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) fetchQuestions();
  };

  const reset = () => {
    setFormData({
      langid: 1,
      lessonid: [],
      question: '',
      quest_doc: '',
      answer: '',
      answer_doc: '',
      explain: '',
      euserid: 1,
    });
  };

  const open = () => {
    reset();
    setEditing(null);
    setShowModal(true);
  };

  const close = () => {
    reset();
    setEditing(null);
    setShowModal(false);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Questions Management</h1>
          <p className="text-gray-600 mt-1">Manage descriptive questions with multimedia</p>
        </div>
        <button onClick={open} className="btn btn-primary flex items-center gap-2">
          <span className="text-xl">+</span>
          Add New Question
        </button>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Lessons</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No questions found.</td></tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.questid}>
                    <td>{q.questid}</td>
                    <td className="font-semibold text-primary-600">{q.question?.slice(0, 50)}...</td>
                    <td>
                      {q.lessons?.map(l => l.lesson).join(', ') || '—'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditing(q); setFormData(q); setShowModal(true); }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(q.questid)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit Question' : 'Add New Question'}</h2>

            <form onSubmit={submit} className="space-y-4">
              {/* MULTI SELECT LESSON */}
              <div>
                <label className="form-label">Lessons *</label>
                <select
                  multiple
                  required
                  className="form-input h-32"
                  value={formData.lessonid as number[] || []}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lessonid: Array.from(e.target.selectedOptions).map(o => Number(o.value)),
                    })
                  }
                >
                  {lessons.map(l => (
                    <option key={l.lessonid} value={l.lessonid}>
                      {l.lesson}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Question *</label>
                <textarea required className="form-textarea" value={formData.question || ''} onChange={(e) => setFormData({ ...formData, question: e.target.value })}/>
              </div>

              <div>
                <label className="form-label">Answer *</label>
                <textarea required className="form-textarea" value={formData.answer || ''} onChange={(e) => setFormData({ ...formData, answer: e.target.value })}/>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {editing ? 'Update Question' : 'Create Question'}
                </button>
                <button type="button" className="btn btn-secondary flex-1" onClick={close}>
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
