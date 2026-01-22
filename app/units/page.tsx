'use client';

import { useEffect, useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Unit, Subject, Exam, Language } from '@/types/database';

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const chapterEditorRef = useRef<any>(null);

  const [formData, setFormData] = useState<any>({
    langid: undefined,
    examid: undefined,
    subjectid: undefined,
    unit: '',
    chapter: '',
    unit_doc: '',
    marks_total: 0,
    euserid: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, sRes, eRes, lRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/subjects'),
        fetch('/api/exams'),
        fetch('/api/language'),
      ]);

      const unitsData = await uRes.json();
      const subjectsData = await sRes.json();
      const examsData = await eRes.json();
      const langData = await lRes.json();

      if (unitsData.success) setUnits(unitsData.data);
      if (subjectsData.success) {
        console.log('Subjects loaded:', subjectsData.data);
        setSubjects(subjectsData.data);
      }
      if (examsData.success) setExams(examsData.data);
      if (langData.success) setLanguages(langData.data);

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
      subjectid: undefined,
      unit: '',
      chapter: '',
      unit_doc: '',
      marks_total: 0,
      euserid: 1,
    });
    setSelectedFile(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingUnit(null);
    setShowModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Upload file immediately
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'unit');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success) {
        setFormData((prev: any) => ({ ...prev, unit_doc: data.url }));
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
    const chapter = chapterEditorRef.current?.getContent() || '';

    const body = editingUnit
      ? { ...formData, chapter, unitid: editingUnit.unitid }
      : { ...formData, chapter };

    const res = await fetch('/api/units', {
      method: editingUnit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message);
      closeModal();
      fetchData();
    } else {
      alert(data.error || 'Error saving unit');
    }
  };

  const handleEdit = (u: any) => {
    setEditingUnit(u);
    setFormData({
      langid: u.langid,
      examid: u.examid,
      subjectid: u.subjectid,
      unit: u.unit,
      chapter: u.chapter || '',
      unit_doc: u.unit_doc || '',
      marks_total: u.marks_total || 0,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this unit?')) return;

    const res = await fetch(`/api/units?unitid=${id}&euserid=1`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (data.success) fetchData();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    resetForm();
  };

  // Filter exams based on selected language
  const filteredExams = formData.langid
    ? exams.filter(e => e.langid === formData.langid)
    : exams;

  // Filter subjects based on selected exam
  const filteredSubjects = formData.examid
    ? subjects.filter(s => {
        const examMatch = s.examid === formData.examid;
        const langMatch = formData.langid ? s.langid === formData.langid : true;
        return examMatch && langMatch;
      })
    : [];

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
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 rounded-full border-b-2 border-primary-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Units Management</h1>
          <p className="text-gray-600">Organize units under subjects</p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          + Add Unit
        </button>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">Unit</th>
                <th className="whitespace-nowrap">Subject</th>
                <th className="whitespace-nowrap">Exam</th>
                <th className="whitespace-nowrap">Language</th>
                <th className="whitespace-nowrap">Marks</th>
                <th className="whitespace-nowrap">Document</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No units available
                  </td>
                </tr>
              ) : (
                units.map((u: any) => (
                  <tr key={u.unitid}>
                    <td className="whitespace-nowrap">{u.unitid}</td>
                    <td className="font-semibold text-primary-600 whitespace-nowrap">{u.unit}</td>
                    <td className="whitespace-nowrap">{u.subject_name}</td>
                    <td className="whitespace-nowrap">{u.exam_name}</td>
                    <td className="whitespace-nowrap">{u.lang_name || '—'}</td>
                    <td className="whitespace-nowrap">{u.marks_total}</td>
                    <td className="whitespace-nowrap">
                      {u.unit_doc ? (
                        <a href={u.unit_doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          📄 View
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(u)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(u.unitid)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">
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

            <button onClick={closeModal} className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10">✕</button>

            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">{editingUnit ? 'Edit Unit' : 'Add Unit'}</h2>
              <p className="text-sm text-gray-500 mt-1">{editingUnit ? 'Update unit details below' : 'Enter details to create a new unit'}</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Language */}
                <div>
                  <label className="form-label">Language</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.langid || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      langid: e.target.value ? Number(e.target.value) : undefined,
                      examid: undefined, 
                      subjectid: undefined 
                    })}
                  >
                    <option value="">All Languages</option>
                    {languages.map((l) => (
                      <option key={l.langid} value={l.langid}>{l.lang_name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select language to filter exams, or leave blank to see all</p>
                </div>

                {/* Exam */}
                <div>
                  <label className="form-label">Exam *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.examid || ''}
                    onChange={(e) => setFormData({ ...formData, examid: Number(e.target.value), subjectid: undefined })}
                    required
                  >
                    <option value="">Select Exam</option>
                    {filteredExams.map((ex) => (
                      <option key={ex.examid} value={ex.examid}>
                        {ex.exam} {ex.lang_name ? `(${ex.lang_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="form-label">Subject *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={formData.subjectid || ''}
                    onChange={(e) => setFormData({ ...formData, subjectid: Number(e.target.value) })}
                    required
                    disabled={!formData.examid}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>
                    ))}
                  </select>
                  {!formData.examid && <p className="text-xs text-gray-500 mt-1">Please select an exam first</p>}
                </div>

                {/* Unit Name */}
                <div>
                  <label className="form-label">Unit Name *</label>
                  <input 
                    className="form-input" 
                    required 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>

                {/* Total Marks */}
                <div>
                  <label className="form-label">Total Marks</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.marks_total}
                    onChange={(e) => setFormData({ ...formData, marks_total: Number(e.target.value) })}
                  />
                </div>

                {/* Chapter Content - TinyMCE */}
                <div>
                  <label className="form-label">Chapter Content</label>
                  <Editor
                    onInit={(evt, editor) => chapterEditorRef.current = editor}
                    initialValue={formData.chapter}
                    init={editorConfig}
                  />
                </div>

                {/* Document Upload */}
                <div>
                  <label className="form-label">Unit Document</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="unit-file-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="unit-file-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? '⏳ Uploading...' : '📁 Browse File'}
                      </label>
                      {selectedFile && <span className="text-sm text-gray-600">{selectedFile.name}</span>}
                    </div>
                    {formData.unit_doc && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">✓ File uploaded:</span>
                        <a href={formData.unit_doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, unit_doc: '' });
                            setSelectedFile(null);
                          }}
                          className="text-red-600 hover:underline ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                </div>

                <button className="btn btn-primary w-full" type="submit" disabled={uploading}>
                  {uploading ? 'Please wait...' : editingUnit ? 'Update Unit' : 'Create Unit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}