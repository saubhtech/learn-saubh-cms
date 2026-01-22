'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

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
  examid: number;
}

interface Lesson {
  lessonid: number;
  lesson: string;
  subjectid: number;
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<MCQ | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const questionEditorRef = useRef<any>(null);
  const option1EditorRef = useRef<any>(null);
  const option2EditorRef = useRef<any>(null);
  const option3EditorRef = useRef<any>(null);
  const option4EditorRef = useRef<any>(null);
  const explainEditorRef = useRef<any>(null);

  const [form, setForm] = useState({
    langid: undefined as number | undefined,
    examid: undefined as number | undefined,
    subjectid: undefined as number | undefined,
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
      const [m, ln, s, e, lg] = await Promise.all([
        fetch('/api/mcqs').then(r => r.json()),
        fetch('/api/lessons').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
      ]);

      if (m.success) setMcqs(m.data);
      if (ln.success) setLessons(ln.data);
      if (s.success) setSubjects(s.data);
      if (e.success) setExams(e.data);
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

    // Get content from TinyMCE editors
    const question = questionEditorRef.current?.getContent() || '';
    const option1 = option1EditorRef.current?.getContent() || '';
    const option2 = option2EditorRef.current?.getContent() || '';
    const option3 = option3EditorRef.current?.getContent() || '';
    const option4 = option4EditorRef.current?.getContent() || '';
    const explain = explainEditorRef.current?.getContent() || '';

    if (!option1 || !option2) {
      alert('At least 2 options are required');
      return;
    }

    if (!form.lessonid || form.lessonid.length === 0) {
      alert('Please select at least one lesson');
      return;
    }

    const method = edit ? 'PUT' : 'POST';
    const body = edit 
      ? { ...form, question, option1, option2, option3, option4, explain, mcqid: edit.mcqid } 
      : { ...form, question, option1, option2, option3, option4, explain };

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
      examid: undefined,
      subjectid: undefined,
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

  // Hierarchical filtering
  const filteredExams = form.langid
    ? exams.filter(e => e.langid === form.langid)
    : [];

  const filteredSubjects = form.examid
    ? subjects.filter(s => s.examid === form.examid)
    : [];

  const filteredLessons = form.subjectid
    ? lessons.filter(l => l.subjectid === form.subjectid)
    : [];

  const editorConfig = {
    height: 200,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
  };

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
                      <div className="truncate" dangerouslySetInnerHTML={{ __html: m.question }} />
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
                              examid: undefined,
                              subjectid: undefined,
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
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-lg">
            
            <button onClick={close} className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10">✕</button>

            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">{edit ? 'Edit MCQ' : 'Add MCQ'}</h2>
              <p className="text-sm text-gray-500 mt-1">{edit ? 'Update MCQ details below' : 'Enter details to create a new MCQ'}</p>
            </div>

            <div className="p-6">
              <form onSubmit={submit} className="space-y-4">

                {/* LANGUAGE */}
                <div>
                  <label className="form-label">Language *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.langid || ''}
                    required
                    onChange={e => setForm({ ...form, langid: Number(e.target.value), examid: undefined, subjectid: undefined, lessonid: [] })}
                  >
                    <option value="">Select Language</option>
                    {languages.map(l => <option key={l.langid} value={l.langid}>{l.lang_name}</option>)}
                  </select>
                </div>

                {/* EXAM */}
                <div>
                  <label className="form-label">Exam *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.examid || ''}
                    required
                    disabled={!form.langid}
                    onChange={e => setForm({ ...form, examid: Number(e.target.value), subjectid: undefined, lessonid: [] })}
                  >
                    <option value="">Select Exam</option>
                    {filteredExams.map(e => <option key={e.examid} value={e.examid}>{e.exam}</option>)}
                  </select>
                </div>

                {/* SUBJECT */}
                <div>
                  <label className="form-label">Subject *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.subjectid || ''}
                    required
                    disabled={!form.examid}
                    onChange={e => setForm({ ...form, subjectid: Number(e.target.value), lessonid: [] })}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
                  </select>
                </div>

                {/* LESSONS */}
                <div>
                  <label className="form-label">Lessons * (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    required
                    className="form-select bg-white text-black h-32"
                    value={form.lessonid.map(String)}
                    disabled={!form.subjectid}
                    onChange={(e) => setForm({ ...form, lessonid: Array.from(e.target.selectedOptions).map(o => Number(o.value)) })}
                  >
                    {filteredLessons.map(l => <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>)}
                  </select>
                  {form.lessonid.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">{form.lessonid.length} lesson{form.lessonid.length !== 1 ? 's' : ''} selected</p>
                  )}
                </div>

                {/* QUESTION */}
                <div>
                  <label className="form-label">Question *</label>
                  <Editor
                    onInit={(evt, editor) => questionEditorRef.current = editor}
                    initialValue={form.question}
                    init={editorConfig}
                  />
                </div>

                {/* Question Documents */}
                <div>
                  <label className="form-label">Question Documents/Images</label>
                  <div className="space-y-2">
                    <input type="file" id="quest-doc-upload" className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={(e) => handleFileUpload(e, 'quest_doc')} disabled={uploading !== null} />
                    <label htmlFor="quest-doc-upload" className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading === 'quest_doc' ? '⏳ Uploading...' : '📁 Browse Question File'}
                    </label>
                    {form.quest_doc && form.quest_doc.length > 0 && (
                      <div className="space-y-1">
                        {form.quest_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">📄 Question File {idx + 1}</a>
                            <button type="button" onClick={() => removeFile('quest_doc', idx)} className="text-red-600 hover:underline">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* OPTIONS */}
                <div className="space-y-3">
                  <label className="form-label">Answer Options *</label>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 1 *</label>
                    <Editor onInit={(evt, editor) => option1EditorRef.current = editor} initialValue={form.option1} init={{ ...editorConfig, height: 150 }} />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 2 *</label>
                    <Editor onInit={(evt, editor) => option2EditorRef.current = editor} initialValue={form.option2} init={{ ...editorConfig, height: 150 }} />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 3 (Optional)</label>
                    <Editor onInit={(evt, editor) => option3EditorRef.current = editor} initialValue={form.option3} init={{ ...editorConfig, height: 150 }} />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Option 4 (Optional)</label>
                    <Editor onInit={(evt, editor) => option4EditorRef.current = editor} initialValue={form.option4} init={{ ...editorConfig, height: 150 }} />
                  </div>
                </div>

                {/* ANSWER */}
                <div>
                  <label className="form-label">Correct Answer *</label>
                  <select className="form-select bg-white text-black" required value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })}>
                    <option value="">Select correct answer</option>
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                    <option value="4">Option 4</option>
                  </select>
                </div>

                {/* EXPLANATION */}
                <div>
                  <label className="form-label">Explanation</label>
                  <Editor onInit={(evt, editor) => explainEditorRef.current = editor} initialValue={form.explain} init={editorConfig} />
                </div>

                {/* Answer Documents */}
                <div>
                  <label className="form-label">Answer Explanation Documents</label>
                  <div className="space-y-2">
                    <input type="file" id="answer-doc-upload" className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={(e) => handleFileUpload(e, 'answer_doc')} disabled={uploading !== null} />
                    <label htmlFor="answer-doc-upload" className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading === 'answer_doc' ? '⏳ Uploading...' : '📁 Browse Answer File'}
                    </label>
                    {form.answer_doc && form.answer_doc.length > 0 && (
                      <div className="space-y-1">
                        {form.answer_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">📄 Answer File {idx + 1}</a>
                            <button type="button" onClick={() => removeFile('answer_doc', idx)} className="text-red-600 hover:underline">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={uploading !== null}>
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