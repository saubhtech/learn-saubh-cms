'use client';

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface Lesson {
  lessonid: number;
  lesson: string;
  langid: number;
  examid: number;
  subjectid: number;
}

interface Language {
  langid: number;
  lang_name: string;
}

interface Exam {
  examid: number;
  exam: string;
  langid: number;
}

interface Subject {
  subjectid: number;
  subject: string;
  langid: number;
  examid: number;
}

interface Topic {
  topicid: number;
  topic: string;
  langid: number;
  examid: number;
  subjectid: number;
  lessonid: number;
}

interface QuestionRow {
  questid: number;
  question: string;
  langid: number;
  examid: number;
  subjectid: number;
  lessonid: number;
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // 'quest_doc' | 'answer_doc'

  const questionEditorRef = useRef<any>(null);
  const answerEditorRef = useRef<any>(null);
  const explainEditorRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    langid: undefined as number | undefined,
    examid: undefined as number | undefined,
    subjectid: undefined as number | undefined,
    lessonid: undefined as number | undefined,
    topicid: [] as number[],
    question: '',
    quest_doc: [] as string[],
    answer: '',
    answer_doc: [] as string[],
    explain: '',
    euserid: 1,
  });

  // TinyMCE Editor Configuration
  const editorConfig = {
    apiKey: '5lju5xslblj3hsz63j08txwlz7apyt02nr2z6l2nt5gghtw0',
    height: 300,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [q, t, l, e, s, le] = await Promise.all([
        fetch('/api/questions').then(r => r.json()),
        fetch('/api/topics').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/lessons').then(r => r.json()),
      ]);

      if (q.success) setQuestions(q.data);
      if (t.success) setTopics(t.data);
      if (l.success) setLanguages(l.data);
      if (e.success) setExams(e.data);
      if (s.success) setSubjects(s.data);
      if (le.success) setLessons(le.data);
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

    // Get content from TinyMCE editors
    const questionContent = questionEditorRef.current?.getContent() || formData.question;
    const answerContent = answerEditorRef.current?.getContent() || formData.answer;
    const explainContent = explainEditorRef.current?.getContent() || formData.explain;

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { 
      ...formData, 
      question: questionContent,
      answer: answerContent,
      explain: explainContent,
      questid: editing.questid 
    } : { 
      ...formData, 
      question: questionContent,
      answer: answerContent,
      explain: explainContent 
    };

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
      examid: undefined,
      subjectid: undefined,
      lessonid: undefined,
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
      langid: q.langid,
      examid: q.examid,
      subjectid: q.subjectid,
      lessonid: q.lessonid,
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

  // Cascading filters
  const filteredExams = formData.langid
    ? exams.filter(e => e.langid === formData.langid)
    : [];

  const filteredSubjects = formData.langid && formData.examid
    ? subjects.filter(s => s.langid === formData.langid && s.examid === formData.examid)
    : [];

  const filteredLessons = formData.langid && formData.examid && formData.subjectid
    ? lessons.filter(l => l.langid === formData.langid && l.examid === formData.examid && l.subjectid === formData.subjectid)
    : [];

  const filteredTopics = formData.langid && formData.examid && formData.subjectid && formData.lessonid
    ? topics.filter(t => t.langid === formData.langid && t.examid === formData.examid && t.subjectid === formData.subjectid && t.lessonid === formData.lessonid)
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
                <th className="whitespace-nowrap">Subject</th>
                <th className="whitespace-nowrap">Lesson</th>
                <th className="whitespace-nowrap">Topics</th>
                <th className="whitespace-nowrap">Files</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
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
                      {q.subjectid || '—'}
                    </td>
                    <td className="whitespace-nowrap">
                      {q.lessonid || '—'}
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
                {/* Language (First) */}
                <div>
                  <label className="form-label">Language *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.langid || ''}
                    required
                    onChange={e => setFormData({ 
                      ...formData, 
                      langid: Number(e.target.value), 
                      examid: undefined, 
                      subjectid: undefined, 
                      lessonid: undefined,
                      topicid: [] 
                    })}
                  >
                    <option value="">Select Language</option>
                    {languages.map(l => <option key={l.langid} value={l.langid}>{l.lang_name}</option>)}
                  </select>
                </div>

                {/* Exam (Second) */}
                <div>
                  <label className="form-label">Exam *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.examid || ''}
                    required
                    disabled={!formData.langid}
                    onChange={e => setFormData({ 
                      ...formData, 
                      examid: Number(e.target.value), 
                      subjectid: undefined, 
                      lessonid: undefined,
                      topicid: [] 
                    })}
                  >
                    <option value="">Select Exam</option>
                    {filteredExams.map(e => <option key={e.examid} value={e.examid}>{e.exam}</option>)}
                  </select>
                  {!formData.langid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a language first</p>
                  )}
                </div>

                {/* Subject (Third) */}
                <div>
                  <label className="form-label">Subject *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.subjectid || ''}
                    required
                    disabled={!formData.examid}
                    onChange={e => setFormData({ 
                      ...formData, 
                      subjectid: Number(e.target.value), 
                      lessonid: undefined,
                      topicid: [] 
                    })}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
                  </select>
                  {!formData.examid && (
                    <p className="text-xs text-gray-500 mt-1">Please select an exam first</p>
                  )}
                </div>

                {/* Lesson (Fourth) */}
                <div>
                  <label className="form-label">Lesson *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.lessonid || ''}
                    required
                    disabled={!formData.subjectid}
                    onChange={e => setFormData({ 
                      ...formData, 
                      lessonid: Number(e.target.value),
                      topicid: [] 
                    })}
                  >
                    <option value="">Select Lesson</option>
                    {filteredLessons.map(l => <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>)}
                  </select>
                  {!formData.subjectid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a subject first</p>
                  )}
                </div>

                {/* Topics Multi-Select */}
                <div>
                  <label className="form-label">Topics * (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    required
                    className="form-select bg-white text-black h-40"
                    value={formData.topicid.map(String)}
                    disabled={!formData.lessonid}
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
                  {!formData.lessonid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a lesson first</p>
                  )}
                  {formData.topicid.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {formData.topicid.length} topic{formData.topicid.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Question - TinyMCE Editor */}
                <div>
                  <label className="form-label">Question *</label>
                  <Editor
                    onInit={(evt, editor) => questionEditorRef.current = editor}
                    initialValue={formData.question || ''}
                    init={editorConfig}
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

                {/* Answer - TinyMCE Editor */}
                <div>
                  <label className="form-label">Answer *</label>
                  <Editor
                    onInit={(evt, editor) => answerEditorRef.current = editor}
                    initialValue={formData.answer || ''}
                    init={editorConfig}
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

                {/* Explanation - TinyMCE Editor */}
                <div>
                  <label className="form-label">Explanation</label>
                  <Editor
                    onInit={(evt, editor) => explainEditorRef.current = editor}
                    initialValue={formData.explain || ''}
                    init={editorConfig}
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