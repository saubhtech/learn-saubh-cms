'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Lesson, Subject, Unit, Exam, Language } from '@/types/database';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Lesson | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // 'doc' | 'audio' | 'video'

  const contentEditorRef = useRef<any>(null);

  const [form, setForm] = useState<Partial<Lesson>>({
    langid: undefined,
    examid: undefined,
    subjectid: undefined,
    unitid: undefined,
    lesson: "",
    content: "",
    topicid: [],
    lesson_doc: [],
    lesson_audio: [],
    lesson_video: [],
    marks_total: 0,
    euserid: 1
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [lr, sr, ur, er, lg] = await Promise.all([
        fetch("/api/lessons").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/units").then(r => r.json()),
        fetch("/api/exams").then(r => r.json()),
        fetch("/api/language").then(r => r.json())
      ]);

      if (lr.success) setLessons(lr.data);
      if (sr.success) setSubjects(sr.data);
      if (ur.success) setUnits(ur.data);
      if (er.success) setExams(er.data);
      if (lg.success) setLanguages(lg.data);

    } catch (e) {
      console.error(e);
      alert("Failed loading lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'audio' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file types
    const allowedTypes: { [key: string]: string[] } = {
      doc: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
      video: ['video/mp4', 'video/webm', 'video/ogg']
    };

    if (!allowedTypes[type].includes(file.type)) {
      alert(`Invalid file type for ${type}`);
      return;
    }

    // Validate file size (10MB for docs, 50MB for audio/video)
    const maxSize = type === 'doc' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size must be less than ${type === 'doc' ? '10MB' : '50MB'}`);
      return;
    }

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', `lesson-${type}`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // Add to existing array
        const fieldName = `lesson_${type}` as keyof Lesson;
        const currentArray = (form[fieldName] as string[]) || [];
        setForm(prev => ({
          ...prev,
          [fieldName]: [...currentArray, data.url]
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

  const removeFile = (type: 'doc' | 'audio' | 'video', index: number) => {
    const fieldName = `lesson_${type}` as keyof Lesson;
    const currentArray = (form[fieldName] as string[]) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, [fieldName]: newArray }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Get content from TinyMCE editor
    const editorContent = contentEditorRef.current?.getContent() || '';
    
    const method = edit ? "PUT" : "POST";
    const body = edit ? { 
      ...form, 
      content: editorContent,
      lessonid: edit.lessonid 
    } : { 
      ...form, 
      content: editorContent 
    };

    const res = await fetch("/api/lessons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json());

    if (res.success) {
      setShow(false);
      setEdit(null);
      load();
    } else {
      alert(res.error);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/lessons?lessonid=${id}&euserid=1`, { method: "DELETE" });
    load();
  };

  // Filter exams by language
  const filteredExams = form.langid
    ? exams.filter(e => e.langid === form.langid)
    : [];

  // Filter subjects by language and exam
  const filteredSubjects = form.langid && form.examid
    ? subjects.filter(s => s.langid === form.langid && s.examid === form.examid)
    : [];

  // Filter units by subject
  const filteredUnits = form.subjectid
    ? units.filter(u => u.subjectid === form.subjectid)
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Lessons Management</h1>
          <p className="text-gray-600">Manage lessons linked to units and subjects</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEdit(null);
            setForm({
              langid: undefined,
              examid: undefined,
              subjectid: undefined,
              unitid: undefined,
              lesson: "",
              content: "",
              lesson_doc: [],
              lesson_audio: [],
              lesson_video: [],
              topicid: [],
              marks_total: 0,
              euserid: 1,
            });
            setShow(true);
          }}
        >
          + Add Lesson
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">Lesson</th>
                <th className="whitespace-nowrap">Subject</th>
                <th className="whitespace-nowrap">Unit</th>
                <th className="whitespace-nowrap">Exam</th>
                <th className="whitespace-nowrap">Language</th>
                <th className="whitespace-nowrap">Marks</th>
                <th className="whitespace-nowrap">Files</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No lessons available
                  </td>
                </tr>
              ) : (
                lessons.map(l => (
                  <tr key={l.lessonid}>
                    <td className="whitespace-nowrap">{l.lessonid}</td>
                    <td className="font-semibold text-primary-600 whitespace-nowrap">{l.lesson}</td>
                    <td className="whitespace-nowrap">{l.subject_name}</td>
                    <td className="whitespace-nowrap">{l.unit_name || '—'}</td>
                    <td className="whitespace-nowrap">{l.exam_name}</td>
                    <td className="whitespace-nowrap">{l.lang_name}</td>
                    <td className="whitespace-nowrap">{l.marks_total}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1 text-xs">
                        {l.lesson_doc && l.lesson_doc.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            📄 {l.lesson_doc.length}
                          </span>
                        )}
                        {l.lesson_audio && l.lesson_audio.length > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            🎵 {l.lesson_audio.length}
                          </span>
                        )}
                        {l.lesson_video && l.lesson_video.length > 0 && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            🎬 {l.lesson_video.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          onClick={() => { 
                            setEdit(l); 
                            setForm({ ...l }); 
                            setShow(true) 
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          onClick={() => del(l.lessonid!)}
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
      {show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-lg">

            {/* Close Button */}
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {edit ? "Edit Lesson" : "Add Lesson"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {edit ? "Update lesson details below" : "Enter details to create a new lesson"}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={submit} className="space-y-4">

                {/* Language (First) */}
                <div>
                  <label className="form-label">Language *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.langid || ""}
                    required
                    onChange={e => setForm({ ...form, langid: Number(e.target.value), examid: undefined, subjectid: undefined, unitid: undefined })}
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
                    value={form.examid || ""}
                    required
                    disabled={!form.langid}
                    onChange={e => setForm({ ...form, examid: Number(e.target.value), subjectid: undefined, unitid: undefined })}
                  >
                    <option value="">Select Exam</option>
                    {filteredExams.map(ex => <option key={ex.examid} value={ex.examid}>{ex.exam}</option>)}
                  </select>
                  {!form.langid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a language first</p>
                  )}
                </div>

                {/* Subject (Third) */}
                <div>
                  <label className="form-label">Subject *</label>
                  <select
                    className="form-select bg-white text-black"
                    required
                    value={form.subjectid || ""}
                    disabled={!form.examid}
                    onChange={e => setForm({ ...form, subjectid: Number(e.target.value), unitid: undefined })}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
                  </select>
                  {!form.examid && (
                    <p className="text-xs text-gray-500 mt-1">Please select an exam first</p>
                  )}
                </div>

                {/* Unit (Fourth - Optional) */}
                <div>
                  <label className="form-label">Unit (Optional)</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.unitid || ""}
                    disabled={!form.subjectid}
                    onChange={e => setForm({ ...form, unitid: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Select Unit</option>
                    {filteredUnits.map(u => <option key={u.unitid} value={u.unitid}>{u.unit}</option>)}
                  </select>
                  {!form.subjectid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a subject first</p>
                  )}
                </div>

                {/* Lesson Name (Fifth) */}
                <div>
                  <label className="form-label">Lesson Name *</label>
                  <input
                    className="form-input"
                    value={form.lesson || ""}
                    required
                    onChange={e => setForm({ ...form, lesson: e.target.value })}
                  />
                </div>

                {/* Total Marks */}
                <div>
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.marks_total || ""}
                    onChange={e => setForm({ ...form, marks_total: Number(e.target.value) })}
                  />
                </div>

                {/* Content - TinyMCE Editor */}
                <div>
                  <label className="form-label">Content</label>
                 <Editor
                    onInit={(_evt, editor) => contentEditorRef.current = editor}
                    initialValue={form.content || ''}
                    init={editorConfig}
                  />
                </div>

                {/* Document Upload */}
                <div>
                  <label className="form-label">Documents</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="doc-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'doc')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="doc-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        {uploading === 'doc' ? '⏳ Uploading...' : '📁 Browse Document'}
                      </label>
                    </div>
                    {form.lesson_doc && form.lesson_doc.length > 0 && (
                      <div className="space-y-1">
                        {form.lesson_doc.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              📄 Document {idx + 1}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile('doc', idx)}
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

                {/* Audio Upload */}
                <div>
                  <label className="form-label">Audio Files</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="audio-upload"
                        className="hidden"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(e, 'audio')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="audio-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        {uploading === 'audio' ? '⏳ Uploading...' : '🎵 Browse Audio'}
                      </label>
                    </div>
                    {form.lesson_audio && form.lesson_audio.length > 0 && (
                      <div className="space-y-1">
                        {form.lesson_audio.map((audio, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={audio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              🎵 Audio {idx + 1}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile('audio', idx)}
                              className="text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">MP3, WAV, OGG (Max 50MB)</p>
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="form-label">Video Files</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="video-upload"
                        className="hidden"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor="video-upload"
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        {uploading === 'video' ? '⏳ Uploading...' : '🎬 Browse Video'}
                      </label>
                    </div>
                    {form.lesson_video && form.lesson_video.length > 0 && (
                      <div className="space-y-1">
                        {form.lesson_video.map((video, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <a href={video} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate">
                              🎬 Video {idx + 1}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile('video', idx)}
                              className="text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">MP4, WebM, OGG (Max 50MB)</p>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-full"
                  type="submit"
                  disabled={uploading !== null}
                >
                  {uploading !== null ? 'Please wait...' : edit ? "Update Lesson" : "Create Lesson"}
                </button>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}