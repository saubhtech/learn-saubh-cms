'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';

interface Lesson {
  lessonid: number;
  lesson: string;
}

interface QuestionRow {
  questid: number;
  question: string;
  lessonid: number[];
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);

  const [formData, setFormData] = useState({
    langid: 1,
    lessonid: [] as number[],
    question: '',
    quest_doc: '',
    answer: '',
    answer_doc: '',
    explain: '',
    euserid: 1
  });

  useEffect(() => {
    void loadQuestions();
    void loadLessons();
  }, []);

  const loadQuestions = async () => {
    const r = await fetch('/api/questions');
    const d = await r.json();
    if (d.success) setQuestions(d.data);
  };

  const loadLessons = async () => {
    const r = await fetch('/api/lessons');
    const d = await r.json();
    if (d.success) setLessons(d.data);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...formData, questid: editing.questid } : formData;

    const r = await fetch('/api/questions', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const d = await r.json();
    if (d.success) {
      closeModal();
      void loadQuestions();
    } else {
      alert(d.error);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Delete?')) return;
    const r = await fetch(`/api/questions?questid=${id}&euserid=1`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) void loadQuestions();
  };

  const resetForm = () => {
    setFormData({
      langid: 1,
      lessonid: [],
      question: '',
      quest_doc: '',
      answer: '',
      answer_doc: '',
      explain: '',
      euserid: 1
    });
  };

  const openModal = () => {
    resetForm();
    setEditing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setEditing(null);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Questions Management</h1>
          <p className="text-gray-600 mt-1">Manage descriptive questions with multimedia</p>
        </div>
        <button onClick={openModal} className="btn btn-primary flex items-center gap-2">
          <span className="text-xl">+</span> Add Question
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Lesson IDs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">No questions found.</td></tr>
            ) : questions.map(q => (
              <tr key={q.questid}>
                <td>{q.questid}</td>
                <td>{q.question.slice(0,50)}...</td>
                <td>{q.lessonid.join(', ')}</td>
                <td className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                    onClick={() => {
                      setEditing(q);
                      setFormData({ ...formData, lessonid: q.lessonid, question: q.question });
                      setShowModal(true);
                    }}>
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-100 text-red-700 rounded"
                    onClick={() => deleteQuestion(q.questid)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="form-label">Select Lessons *</label>
                <select
                  multiple
                  required
                  className="form-input h-32"
                  value={formData.lessonid.map(String)}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFormData({
                      ...formData,
                      lessonid: Array.from(e.target.selectedOptions).map(o => Number(o.value))
                    })
                  }
                >
                  {lessons.map(l => (
                    <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>
                  ))}
                </select>
              </div>

              <textarea
                className="form-textarea"
                placeholder="Question"
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />

              <textarea
                className="form-textarea"
                placeholder="Answer"
                required
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              />

              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary flex-1" type="submit">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button className="btn btn-secondary flex-1" type="button" onClick={closeModal}>
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
