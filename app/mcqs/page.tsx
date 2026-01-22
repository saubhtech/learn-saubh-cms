'use client';

import { useEffect, useState, FormEvent } from 'react';

interface Language {
  langid: number;
  lang_name: string;
}

interface Lesson {
  lessonid: number;
  langid: number; // ✅ ADDED - This was missing
  lesson: string;
  subjectid?: number;
}

interface MCQ {
  mcqid: number;
  langid: number;
  lessonid: number[];
  question: string;
  quest_doc?: string[];
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
  answer: string;
  answer_doc?: string[];
  explain?: string;
  lang_name?: string;
}

export default function MCQsPage() {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<MCQ | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [form, setForm] = useState({
    langid: undefined as number | undefined,
    lessonid: [] as number[],
    question: '',
    quest_doc: [] as string[],
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    answer: '',
    answer_doc: [] as string[],
    explain: '',
    euserid: 1
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [m, l, lg] = await Promise.all([
        fetch('/api/mcqs').then(r => r.json()),
        fetch('/api/lessons').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
      ]);

      if (m.success) setMcqs(m.data);
      if (l.success) setLessons(l.data);
      if (lg.success) setLanguages(lg.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('Failed loading data');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'quest_doc' | 'answer_doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, DOC, DOCX, or images.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(type);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', `mcq-${type}`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success) {
        const currentArray = form[type] || [];
        setForm(prev => ({
          ...prev,
          [type]: [...currentArray, data.url]
        }));
        alert('File uploaded successfully!');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const removeFile = (type: 'quest_doc' | 'answer_doc', index: number) => {
    const currentArray = form[type] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, [type]: newArray }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.option1 || !form.option2) {
      alert('At least 2 options are required');
      return;
    }

    if (!form.lessonid || form.lessonid.length === 0) {
      alert('Please select at least one lesson');
      return;
    }

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
      loadAll();
    } else {
      alert(d.error);
    }
  };

  const remove = async (mcqid: number) => {
    if (!confirm('Delete this MCQ?')) return;
    await fetch(`/api/mcqs?mcqid=${mcqid}&euserid=1`, { method: 'DELETE' });
    loadAll();
  };

  const close = () => {
    setShow(false);
    setEdit(null);
    setForm({
      langid: undefined,
      lessonid: [],
      question: '',
      quest_doc: [],
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      answer: '',
      answer_doc: [],
      explain: '',
      euserid: 1
    });
  };

  // ✅ FIXED: Now TypeScript knows langid exists in Lesson interface
  const filteredLessons = form.langid
    ? lessons.filter(l => l.langid === form.langid)
    : [];

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Multiple Choice Questions</h1>
          <p className="text-gray-600">Manage MCQs for examinations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>
          + Add MCQ
        </button>
      </div>

      {/* TABLE LIST */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">Question</th>
                <th className="whitespace-nowrap">Answer</th>
                <th className="whitespace-nowrap">Lessons</th>
                <th className="whitespace-nowrap">Language</th>
                <th className="whitespace-nowrap">Files</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mcqs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No MCQs available
                  </td>
                </tr>
              ) : (
                mcqs.map(m => (
                  <tr key={m.mcqid}>
                    <td className="whitespace-nowrap">{m.mcqid}</td>
                    <td className="max-w-md">
                      <div className="truncate">{m.question}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                        Option {m.answer}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {Array.isArray(m.lessonid) ? m.lessonid.length : 0} lesson{Array.isArray(m.lessonid) && m.lessonid.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{m.lang_name || '—'}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1 text-xs">
                        {m.quest_doc && Array.isArray(m.quest_doc) && m.quest_doc.length > 0 && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            📄Q {m.quest_doc.length}
                          </span>
                        )}
                        {m.answer_doc && Array.isArray(m.answer_doc) && m.answer_doc.length > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            📄A {m.answer_doc.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEdit(m);
                            setForm({
                              langid: m.langid,
                              lessonid: Array.isArray(m.lessonid) ? m.lessonid : [],
                              question: m.question || '',
                              quest_doc: Array.isArray(m.quest_doc) ? m.quest_doc : [],
                              option1: m.option1 || '',
                              option2: m.option2 || '',
                              option3: m.option3 || '',
                              option4: m.option4 || '',
                              answer: m.answer || '',
                              answer_doc: Array.isArray(m.answer_doc) ? m.answer_doc : [],
                              explain: m.explain || '',
                              euserid: 1
                            });
                            setShow(true);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(m.mcqid)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
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
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-lg">
            
            {/* Close Button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {edit ? 'Edit MCQ' : 'Add MCQ'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {edit ? 'Update MCQ details below' : 'Enter details to create a new MCQ (minimum 2 options required)'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={submit} className="space-y-4">

                {/* LANGUAGE */}
                <div>
                  <label className="form-label">Language *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.langid || ''}
                    required
                    onChange={e => setForm({ ...form, langid: Number(e.target.value), lessonid: [] })}
                  >
                    <option value="">Select Language</option>
                    {languages.map(l => (
                      <option key={l.langid} value={l.langid}>{l.lang_name}</option>
                    ))}
                  </select>
                </div>

                {/* LESSON MULTI SELECT */}
                <div>
                  <label className="form-label">Lessons * (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    required
                    className="form-select bg-white text-black h-32"
                    value={form.lessonid.map(String)}
                    disabled={!form.langid}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lessonid: Array.from(e.target.selectedOptions).map(o => Number(o.value))
                      })
                    }
                  >
                    {filteredLessons.map(l => (
                      <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>
                    ))}
                  </select>
                  {!form.langid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a language first</p>
                  )}
                  {form.lessonid.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {form.lessonid.length} lesson{form.lessonid.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* QUESTION */}
                <div>
                  <label className="form-label">Question *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    required
                    placeholder="Enter the question"
                    value={form.question}
                    onChange={e => setForm({ ...form, question: e.target.value })}
                  />
                </div>

                {/* Question Documents Upload */}
                <div>
                  <label className="form-label">Question Documents/Images</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="quest-doc-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => handleFileUpload(e, 'quest_doc')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="quest-doc-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'quest_doc' ? '⏳ Uploading...' : '📁 Browse Question File'}
                      </label>
                    </div>
                    {form.quest_doc && form.quest_doc.length > 0 && (
                      <div className="space-y-1">
                        {form.quest_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              📄 Question File {idx + 1}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile('quest_doc', idx)}
                              className="text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, Images (Max 10MB)</p>
                  </div>
                </div>

                {/* OPTIONS with spacing */}
                <div className="space-y-3">
                  <label className="form-label">Answer Options * (Minimum 2 required)</label>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 1 *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="Enter option 1"
                      value={form.option1}
                      onChange={e => setForm({ ...form, option1: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 2 *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="Enter option 2"
                      value={form.option2}
                      onChange={e => setForm({ ...form, option2: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 3 (Optional)</label>
                    <input
                      className="form-input"
                      placeholder="Enter option 3 (optional)"
                      value={form.option3}
                      onChange={e => setForm({ ...form, option3: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 4 (Optional)</label>
                    <input
                      className="form-input"
                      placeholder="Enter option 4 (optional)"
                      value={form.option4}
                      onChange={e => setForm({ ...form, option4: e.target.value })}
                    />
                  </div>
                </div>

                {/* ANSWER */}
                <div>
                  <label className="form-label">Correct Answer *</label>
                  <select
                    className="form-select bg-white text-black"
                    required
                    value={form.answer}
                    onChange={e => setForm({ ...form, answer: e.target.value })}
                  >
                    <option value="">Select correct answer</option>
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    {form.option3 && <option value="3">Option 3</option>}
                    {form.option4 && <option value="4">Option 4</option>}
                  </select>
                </div>

                {/* EXPLANATION */}
                <div>
                  <label className="form-label">Explanation</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Explain why this is the correct answer (optional)"
                    value={form.explain}
                    onChange={e => setForm({ ...form, explain: e.target.value })}
                  />
                </div>

                {/* Answer Documents Upload */}
                <div>
                  <label className="form-label">Answer Explanation Documents</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="answer-doc-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => handleFileUpload(e, 'answer_doc')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="answer-doc-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'answer_doc' ? '⏳ Uploading...' : '📁 Browse Answer File'}
                      </label>
                    </div>
                    {form.answer_doc && form.answer_doc.length > 0 && (
                      <div className="space-y-1">
                        {form.answer_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              📄 Answer File {idx + 1}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile('answer_doc', idx)}
                              className="text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, Images (Max 10MB)</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={uploading !== null}
                >
                  {uploading !== null ? 'Please wait...' : edit ? 'Update MCQ' : 'Create MCQ'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}