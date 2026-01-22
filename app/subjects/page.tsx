'use client';

import { useEffect, useState, useRef } from 'react';
import { Subject, Exam } from '@/types/database';

interface Language {
  langid: number;
  lang_name: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const editorRef = useRef<any>(null);

  const [formData, setFormData] = useState<Partial<Subject>>({
    langid: undefined,
    examid: undefined,
    subject: '',
    syllabus: '',
    subj_doc: '',
    marks_total: 0,
    marks_theory: 0,
    marks_activity: 0,
    marks_practicum: 0,
    pass_total: 0,
    pass_practicum: 0,
    euserid: 1,
  });

  useEffect(() => {
    loadData();
    loadTinyMCE();
  }, []);

  const loadTinyMCE = () => {
    const TINYMCE_API_KEY = '5lju5xslblj3hsz63j08txwlz7apyt02nr2z6l2nt5gghtw0';
    
    if (!document.querySelector('script[src*="tinymce"]')) {
      const script = document.createElement('script');
      script.src = `https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/6/tinymce.min.js`;
      script.referrerPolicy = 'origin';
      document.head.appendChild(script);
    }
  };

  useEffect(() => {
    if (showModal && typeof window !== 'undefined') {
      const checkAndInit = () => {
        if ((window as any).tinymce) {
          initTinyMCE();
        } else {
          setTimeout(checkAndInit, 100);
        }
      };
      setTimeout(checkAndInit, 200);
    }

    return () => {
      if ((window as any).tinymce) {
        (window as any).tinymce.remove('#syllabus-editor');
      }
    };
  }, [showModal, formData.syllabus]);

  const initTinyMCE = () => {
    if (!(window as any).tinymce) return;

    (window as any).tinymce.remove('#syllabus-editor');

    (window as any).tinymce.init({
      selector: '#syllabus-editor',
      height: 300,
      menubar: false,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
        'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | ' +
        'forecolor backcolor | removeformat | code | help',
      content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
      promotion: false,
      branding: false,
      setup: (editor: any) => {
        editorRef.current = editor;
        editor.on('init', () => {
          editor.setContent(formData.syllabus || '');
        });
        editor.on('keyup change', () => {
          const content = editor.getContent();
          setFormData(prev => ({ ...prev, syllabus: content }));
        });
      }
    });
  };

  const loadData = async () => {
    try {
      const [sr, er, lr] = await Promise.all([
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
      ]);

      if (sr.success) setSubjects(sr.data);
      if (er.success) setExams(er.data);
      if (lr.success) setLanguages(lr.data);

    } catch (err) {
      console.error(err);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      langid: undefined,
      examid: undefined,
      subject: '',
      syllabus: '',
      subj_doc: '',
      marks_total: 0,
      marks_theory: 0,
      marks_activity: 0,
      marks_practicum: 0,
      pass_total: 0,
      pass_practicum: 0,
      euserid: 1,
    });
    setSelectedFile(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingSubject(null);
    setShowModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'subject');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, subj_doc: data.url }));
        alert('File uploaded successfully!');
      } else {
        alert(data.error || 'Upload failed');
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get content from TinyMCE editor
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      formData.syllabus = content;
    }

    const method = editingSubject ? 'PUT' : 'POST';
    const body = editingSubject
      ? { ...formData, subjectid: editingSubject.subjectid }
      : formData;

    const res = await fetch('/api/subjects', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message);
      setShowModal(false);
      resetForm();
      loadData();
    } else {
      alert(data.error || 'Error saving subject');
    }
  };

  const handleEdit = (s: Subject) => {
    setEditingSubject(s);
    setFormData({
      langid: s.langid,
      examid: s.examid,
      subject: s.subject,
      syllabus: s.syllabus || '',
      subj_doc: s.subj_doc || '',
      marks_total: s.marks_total || 0,
      marks_theory: s.marks_theory || 0,
      marks_activity: s.marks_activity || 0,
      marks_practicum: s.marks_practicum || 0,
      pass_total: s.pass_total || 0,
      pass_practicum: s.pass_practicum || 0,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this subject?")) return;

    const res = await fetch(`/api/subjects?subjectid=${id}&euserid=1`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) loadData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 rounded-full border-b-2 border-primary-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Subjects Management</h1>
          <p className="text-gray-600">Manage subjects linked to exams</p>
        </div>

        <button
          onClick={openAddModal}
          className="btn btn-primary"
        >
          + Add Subject
        </button>
      </div>

      {/* Table with proper overflow handling */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">Subject</th>
                <th className="whitespace-nowrap">Exam</th>
                <th className="whitespace-nowrap">Language</th>
                <th className="whitespace-nowrap">Total</th>
                <th className="whitespace-nowrap">Theory</th>
                <th className="whitespace-nowrap">Practicum</th>
                <th className="whitespace-nowrap">Pass</th>
                <th className="whitespace-nowrap">Syllabus</th>
                <th className="whitespace-nowrap">Document</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    No subjects
                  </td>
                </tr>
              ) : (
                subjects.map(s => (
                  <tr key={s.subjectid}>
                    <td className="whitespace-nowrap">{s.subjectid}</td>
                    <td className="font-semibold text-primary-600 whitespace-nowrap">{s.subject}</td>
                    <td className="whitespace-nowrap">{s.exam_name}</td>
                    <td className="whitespace-nowrap">{s.lang_name}</td>
                    <td className="whitespace-nowrap">{s.marks_total}</td>
                    <td className="whitespace-nowrap">{s.marks_theory}</td>
                    <td className="whitespace-nowrap">{s.marks_practicum}</td>
                    <td className="whitespace-nowrap">{s.pass_total}</td>
                    <td className="max-w-xs">
                      <div 
                        className="truncate text-sm" 
                        dangerouslySetInnerHTML={{ __html: s.syllabus || "—" }}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      {s.subj_doc ? (
                        <a href={s.subj_doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          📄 View
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition" 
                          onClick={() => handleEdit(s)}
                        >
                          Edit
                        </button>
                        <button 
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition" 
                          onClick={() => handleDelete(s.subjectid!)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-lg">

            {/* Close */}
            <button 
              className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10" 
              onClick={() => {
                setShowModal(false);
                if ((window as any).tinymce) {
                  (window as any).tinymce.remove('#syllabus-editor');
                  editorRef.current = null;
                }
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingSubject ? 'Update subject details below' : 'Enter details to create a new subject'}
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
                    onChange={e => setFormData({ ...formData, langid: Number(e.target.value) })} 
                    required
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
                    onChange={e => setFormData({ ...formData, examid: Number(e.target.value) })} 
                    required
                  >
                    <option value="">Select Exam</option>
                    {exams.map(x => <option key={x.examid} value={x.examid}>{x.exam}</option>)}
                  </select>
                </div>

                {/* Subject (Third) */}
                <div>
                  <label className="form-label">Subject Name *</label>
                  <input 
                    className="form-input" 
                    value={formData.subject} 
                    onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                    required 
                  />
                </div>

                {/* Marks */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Total Marks</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.marks_total} 
                      onChange={e => setFormData({ ...formData, marks_total: Number(e.target.value) })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Theory Marks</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.marks_theory} 
                      onChange={e => setFormData({ ...formData, marks_theory: Number(e.target.value) })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Practicum Marks</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.marks_practicum} 
                      onChange={e => setFormData({ ...formData, marks_practicum: Number(e.target.value) })} 
                    />
                  </div>
                </div>

                {/* Activity Marks */}
                <div>
                  <label className="form-label">Activity Marks</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.marks_activity} 
                    onChange={e => setFormData({ ...formData, marks_activity: Number(e.target.value) })} 
                  />
                </div>

                {/* Pass Marks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Pass Total</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.pass_total} 
                      onChange={e => setFormData({ ...formData, pass_total: Number(e.target.value) })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Pass Practicum</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.pass_practicum} 
                      onChange={e => setFormData({ ...formData, pass_practicum: Number(e.target.value) })} 
                    />
                  </div>
                </div>

                {/* Syllabus with TinyMCE */}
                <div>
                  <label className="form-label">Syllabus</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <textarea
                      id="syllabus-editor"
                      className="w-full p-3"
                      rows={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Rich text editor with formatting support. You can paste content from Word/Google Docs.
                  </p>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="form-label">Subject Document</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading ? '⏳ Uploading...' : '📁 Browse File'}
                      </label>
                      {selectedFile && (
                        <span className="text-sm text-gray-600">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                    {formData.subj_doc && (
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                        <span className="text-green-600">✓ File uploaded:</span>
                        <a 
                          href={formData.subj_doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex-1"
                        >
                          View Document
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, subj_doc: '' });
                            setSelectedFile(null);
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Accepted formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </div>
                </div>

                <button className="btn btn-primary w-full" type="submit" disabled={uploading}>
                  {uploading ? 'Please wait...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}