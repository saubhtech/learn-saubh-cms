'use client';

import { useEffect, useState, FormEvent } from 'react';
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
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    // ❗ FIX starts
    answer: undefined,    // NOT "", because TS union type
    // ❗ FIX ends
    quest_doc: '',
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

  async function submit(e: FormEvent) {
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
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      // ❗ FIX again
      answer: undefined,
      quest_doc: '',
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
        <h1 className="text-3xl font-bold">Multiple Choice Questions</h1>
        <button className="btn btn-primary" onClick={() => setShow(true)}>
          + Add New MCQ
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
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">No MCQs found</td></tr>
              ) : mcqs.map(m => (
                <tr key={m.mcqid}>
                  <td>{m.mcqid}</td>
                  <td>{m.question.slice(0,40)}...</td>
                  <td>{m.answer}</td>
                  <td>{m.lessonid?.join(', ')}</td>
                  <td className="flex gap-2">
                    <button onClick={() => (setEdit(m), setShow(true))} className="btn btn-secondary">Edit</button>
                    <button onClick={() => del(m.mcqid!)} className="btn btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl overflow-y-auto">

            <h2 className="text-2xl font-bold mb-4">{edit ? 'Edit MCQ' : 'Add MCQ'}</h2>

            <form onSubmit={submit} className="space-y-4">

              <div>
                <label className="form-label">Lessons</label>
                <select multiple className="form-input h-32"
                  value={form.lessonid as number[]}
                  onChange={e => setForm({
                    ...form,
                    lessonid: Array.from(e.target.selectedOptions).map(o => Number(o.value))
                  })}
                >
                  {lessons.map(l => (
                    <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Question *</label>
                <textarea className="form-textarea"
                  required
                  value={form.question || ''}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input className="form-input" required placeholder="Option 1"
                  value={form.option1 || ''}
                  onChange={e => setForm({ ...form, option1: e.target.value })}
                />
                <input className="form-input" required placeholder="Option 2"
                  value={form.option2 || ''}
                  onChange={e => setForm({ ...form, option2: e.target.value })}
                />
                <input className="form-input" placeholder="Option 3"
                  value={form.option3 || ''}
                  onChange={e => setForm({ ...form, option3: e.target.value })}
                />
                <input className="form-input" placeholder="Option 4"
                  value={form.option4 || ''}
                  onChange={e => setForm({ ...form, option4: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Correct Answer *</label>
                <select className="form-select" required
                  value={form.answer || ''}
                  onChange={e => setForm({ ...form, answer: e.target.value as any })}
                >
                  <option value="">Select</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                  <option value="4">Option 4</option>
                </select>
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary flex-1">{edit ? 'Update' : 'Create' }</button>
                <button type="button" className="btn btn-secondary flex-1" onClick={close}>Cancel</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
