'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';

interface Lesson {
  lessonid: number;
  lesson: string;
}

interface Language {
  langid: number;
  lang_name: string;
}

interface Topic {
  topicid: number;
  topic: string;
  langid: number; // ✅ ADDED - This was missing
  lessonid: number[];
  topic_doc?: string[];
  topic_audio?: string[];
  topic_video?: string[];
}

interface QuestionRow {
  questid: number;
  question: string;
  topicid: number[];
  quest_doc?: string[];
  answer?: string;
  answer_doc?: string[];
  explain?: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // 'quest_doc' | 'answer_doc'

  const [formData, setFormData] = useState({
    langid: undefined as number | undefined,
    topicid: [] as number[],
    question: '',
    quest_doc: [] as string[],
    answer: '',
    answer_doc: [] as string[],
    explain: '',
    euserid: 1,
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [q, t, l] = await Promise.all([
        fetch('/api/questions').then(r => r.json()),
        fetch('/api/topics').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
      ]);

      if (q.success) setQuestions(q.data);
      if (t.success) setTopics(t.data);
      if (l.success) setLanguages(l.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('Failed loading data');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'quest_doc' | 'answer_doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file types
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, DOC, or DOCX files.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(type);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', `question-${type}`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success) {
        // Add to existing array
        const currentArray = formData[type] || [];
        setFormData(prev => ({
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
    const currentArray = formData[type] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [type]: newArray }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.topicid || formData.topicid.length === 0) {
      alert('Please select at least one topic');
      return;
    }

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
      loadAll();
    } else {
      alert(d.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    const r = await fetch(`/api/questions?questid=${id}&euserid=1`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) loadAll();
  };

  const reset = () => {
    setFormData({
      langid: undefined,
      topicid: [],
      question: '',
      quest_doc: [],
      answer: '',
      answer_doc: [],
      explain: '',
      euserid: 1,
    });
  };

  const openModal = () => {
    reset();
    setEditing(null);
    setShowModal(true);
  };

  const closeModal = () => {
    reset();
    setEditing(null);
    setShowModal(false);
  };

  const handleEdit = (q: QuestionRow) => {
    setEditing(q);
    setFormData({
      langid: undefined,
      topicid: Array.isArray(q.topicid) ? q.topicid : [],
      question: q.question || '',
      quest_doc: Array.isArray(q.quest_doc) ? q.quest_doc : [],
      answer: q.answer || '',
      answer_doc: Array.isArray(q.answer_doc) ? q.answer_doc : [],
      explain: q.explain || '',
      euserid: 1,
    });
    setShowModal(true);
  };

  // ✅ FIXED: Filter topics by language - Now TypeScript knows langid exists
  const filteredTopics = formData.langid
    ? topics.filter(t => t.langid === formData.langid)
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Questions Management</h1>
          <p className="text-gray-600">Manage questions linked to topics</p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          + Add Question
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">Question</th>
                <th className="whitespace-nowrap">Topics</th>
                <th className="whitespace-nowrap">Files</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No questions available
                  </td>
                </tr>
              ) : (
                questions.map(q => (
                  <tr key={q.questid}>
                    <td className="whitespace-nowrap">{q.questid}</td>
                    <td className="max-w-md">
                      <div className="truncate">{q.question}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {Array.isArray(q.topicid) ? q.topicid.length : 0} topic{(Array.isArray(q.topicid) && q.topicid.length !== 1) ? 's' : ''}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1 text-xs">
                        {q.quest_doc && Array.isArray(q.quest_doc) && q.quest_doc.length > 0 && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            📄Q {q.quest_doc.length}
                          </span>
                        )}
                        {q.answer_doc && Array.isArray(q.answer_doc) && q.answer_doc.length > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            📄A {q.answer_doc.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          onClick={() => handleEdit(q)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          onClick={() => handleDelete(q.questid)}
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-lg">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editing ? 'Edit Question' : 'Add Question'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editing ? 'Update question details below' : 'Enter details to create a new question'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Language */}
                <div>
                  <label className="form-label">Language *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.langid || ''}
                    required
                    onChange={e => setFormData({ ...formData, langid: Number(e.target.value), topicid: [] })}
                  >
                    <option value="">Select Language</option>
                    {languages.map(l => <option key={l.langid} value={l.langid}>{l.lang_name}</option>)}
                  </select>
                </div>

                {/* Topics Multi-Select */}
                <div>
                  <label className="form-label">Topics * (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    required
                    className="form-select bg-white text-black h-40"
                    value={formData.topicid.map(String)}
                    disabled={!formData.langid}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        topicid: Array.from(e.target.selectedOptions).map(o => Number(o.value)),
                      })
                    }
                  >
                    {filteredTopics.map(t => (
                      <option key={t.topicid} value={t.topicid}>{t.topic}</option>
                    ))}
                  </select>
                  {!formData.langid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a language first</p>
                  )}
                  {formData.topicid.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {formData.topicid.length} topic{formData.topicid.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Question */}
                <div>
                  <label className="form-label">Question *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    required
                    value={formData.question}
                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                  />
                </div>

                {/* Question Documents Upload */}
                <div>
                  <label className="form-label">Question Documents</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="quest-doc-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'quest_doc')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="quest-doc-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'quest_doc' ? '⏳ Uploading...' : '📁 Browse Question Doc'}
                      </label>
                    </div>
                    {formData.quest_doc && formData.quest_doc.length > 0 && (
                      <div className="space-y-1">
                        {formData.quest_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              📄 Question Doc {idx + 1}
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
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                  </div>
                </div>

                {/* Answer */}
                <div>
                  <label className="form-label">Answer *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    required
                    value={formData.answer}
                    onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  />
                </div>

                {/* Answer Documents Upload */}
                <div>
                  <label className="form-label">Answer Documents</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="answer-doc-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'answer_doc')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="answer-doc-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'answer_doc' ? '⏳ Uploading...' : '📁 Browse Answer Doc'}
                      </label>
                    </div>
                    {formData.answer_doc && formData.answer_doc.length > 0 && (
                      <div className="space-y-1">
                        {formData.answer_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              📄 Answer Doc {idx + 1}
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
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="form-label">Explanation</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.explain}
                    onChange={e => setFormData({ ...formData, explain: e.target.value })}
                  />
                </div>

                <button
                  className="btn btn-primary w-full"
                  type="submit"
                  disabled={uploading !== null}
                >
                  {uploading !== null ? 'Please wait...' : editing ? 'Update Question' : 'Create Question'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}