'use client';

import { useEffect, useState } from 'react';
import { MCQ, Lesson } from '@/types/database';

export default function MCQsPage() {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<MCQ | null>(null);

  const [form, setForm] = useState<Partial<MCQ>>({
    langid: 1,
    lessonid: [],
    question: '',
    quest_doc: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    answer: '',
    answer_doc: '',
    explain: '',
    euserid: 1
  });

  useEffect(() => {
    load();
    loadLessons();
  }, []);

  async function load() {
    const r = await fetch('/api/mcqs');
    const d = await r.json();
    if (d.success) setMcqs(d.data);
  }

  async function loadLessons() {
    const r = await fetch('/api/lessons');
    const d = await r.json();
    if (d.success) setLessons(d.data);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const method = edit ? 'PUT' : 'POST';
    const body = edit ? { ...form, mcqid: edit.mcqid } : form;

    const r = await fetch('/api/mcqs', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const d = await r.json();
    if (d.success) {
      close();
      load();
    }
  }

  function close() {
    setShow(false);
    setEdit(null);
    setForm({
      langid: 1,
      lessonid: [],
      question: '',
      quest_doc: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      answer: '',
      answer_doc: '',
      explain: '',
      euserid: 1
    });
  }

  async function del(id: number) {
    if (!confirm('Delete?')) return;
    await fetch(`/api/mcqs?mcqid=${id}&euserid=1`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Multiple Choice Questions</h1>
          <p className="text-gray-600 mt-1">Manage MCQs with options and answers</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShow(true)}>
          <span className="text-xl">+</span>
          Add New MCQ
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Lessons</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mcqs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No MCQs found.</td></tr>
              ) : mcqs.map((m) => (
                <tr key={m.mcqid}>
                  <td>{m.mcqid}</td>
                  <td className="font-semibold text-primary-600">
                    {m.question?.slice(0, 40)}...
                  </td>
                  <td>{m.answer}</td>
                  <td>{(m as any).lessons?.map((l: any) => l.lesson).join(', ')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        onClick={() => (setEdit(m), setShow(true))}>
                        Edit
                      </button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={() => del(m.mcqid!)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">{edit ? 'Edit MCQ' : 'Add New MCQ'}</h2>

            <form onSubmit={submit} className="space-y-4">

              <div>
                <label className="form-label">Lessons *</label>
                <select multiple required className="form-input h-32"
                  value={form.lessonid as number[]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lessonid: Array.from(e.target.selectedOptions).map((o) => parseInt(o.value))
                    })
                  }
                >
                  {lessons.map((l) => (
                    <option key={l.lessonid} value={l.lessonid}>
                      {l.lesson}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Question *</label>
                <textarea className="form-textarea" required value={form.question || ''}
                  onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Option 1 *</label>
                <input className="form-input" required value={form.option1 || ''}
                  onChange={(e) => setForm({ ...form, option1: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Option 2 *</label>
                <input className="form-input" required value={form.option2 || ''}
                  onChange={(e) => setForm({ ...form, option2: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Option 3</label>
                <input className="form-input" value={form.option3 || ''}
                  onChange={(e) => setForm({ ...form, option3: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Option 4</label>
                <input className="form-input" value={form.option4 || ''}
                  onChange={(e) => setForm({ ...form, option4: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Correct Answer *</label>
                <select className="form-select" required value={form.answer || ''}
                  onChange={(e) => setForm({ ...form, answer: e.target.value as any })}>
                  <option value="">Select</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                  <option value="4">Option 4</option>
                </select>
              </div>

              <div>
                <label className="form-label">Question Document URL</label>
                <input className="form-input" value={form.quest_doc || ''}
                  onChange={(e) => setForm({ ...form, quest_doc: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Answer Document URL</label>
                <input className="form-input" value={form.answer_doc || ''}
                  onChange={(e) => setForm({ ...form, answer_doc: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Explanation</label>
                <textarea className="form-textarea" value={form.explain || ''}
                  onChange={(e) => setForm({ ...form, explain: e.target.value })} />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {edit ? 'Update MCQ' : 'Create MCQ'}
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
