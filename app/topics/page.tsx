'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Exam, Subject, Lesson, Topic, Language } from '@/types/database';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // 'doc' | 'audio' | 'video'

  const explainEditorRef = useRef<any>(null);

  const [formData, setFormData] = useState<Partial<Topic>>({
    langid: undefined,
    examid: undefined,
    subjectid: undefined,
    lessonid: undefined,
    topic: '',
    explain: '',
    topic_doc: [],
    topic_audio: [],
    topic_video: [],
    euserid: 1,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [t, e, s, l, g] = await Promise.all([
        fetch('/api/topics').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/lessons').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
      ]);

      if (t.success) setTopics(t.data);
      if (e.success) setExams(e.data);
      if (s.success) setSubjects(s.data);
      if (l.success) setLessons(l.data);
      if (g.success) setLanguages(g.data);
    } catch (err) {
      console.error('Failed to load Topics:', err);
      alert('Failed loading topics');
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
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', `topic-${type}`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success) {
        // Add to existing array
        const fieldName = `topic_${type}` as keyof Topic;
        const currentArray = (formData[fieldName] as string[]) || [];
        setFormData(prev => ({
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
    const fieldName = `topic_${type}` as keyof Topic;
    const currentArray = (formData[fieldName] as string[]) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [fieldName]: newArray }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.lessonid) {
      alert('Please select a lesson');
      return;
    }

    // Get content from TinyMCE editor
    const explainContent = explainEditorRef.current?.getContent() || '';

    const method = editingTopic ? 'PUT' : 'POST';
    const body = editingTopic
      ? { 
          ...formData, 
          explain: explainContent,
          topicid: editingTopic.topicid 
        }
      : { 
          ...formData, 
          explain: explainContent 
        };

    const r = await fetch('/api/topics', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const d = await r.json();
    if (d.success) {
      setShowModal(false);
      setEditingTopic(null);
      fetchAll();
    } else {
      alert(d.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete topic?')) return;
    await fetch(`/api/topics?topicid=${id}&euserid=1`, { method: 'DELETE' });
    fetchAll();
  };

  const openAddModal = () => {
    setEditingTopic(null);
    setFormData({
      langid: undefined,
      examid: undefined,
      subjectid: undefined,
      lessonid: undefined,
      topic: '',
      explain: '',
      topic_doc: [],
      topic_audio: [],
      topic_video: [],
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleEdit = (t: Topic) => {
    setEditingTopic(t);
    setFormData({
      langid: t.langid,
      examid: t.examid,
      subjectid: t.subjectid,
      lessonid: t.lessonid,
      topic: t.topic,
      explain: t.explain,
      topic_doc: t.topic_doc || [],
      topic_audio: t.topic_audio || [],
      topic_video: t.topic_video || [],
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

  const filteredLessons = formData.subjectid
    ? lessons.filter(l => l.subjectid === formData.subjectid)
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
          <h1 className="text-3xl font-bold text-gray-800">Topics Management</h1>
          <p className="text-gray-600">Manage topics linked to lessons</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          + Add Topic
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">Topic</th>
                <th className="whitespace-nowrap">Lesson</th>
                <th className="whitespace-nowrap">Subject</th>
                <th className="whitespace-nowrap">Exam</th>
                <th className="whitespace-nowrap">Language</th>
                <th className="whitespace-nowrap">Files</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No topics available
                  </td>
                </tr>
              ) : (
                topics.map(t => (
                  <tr key={t.topicid}>
                    <td className="whitespace-nowrap">{t.topicid}</td>
                    <td className="font-semibold text-primary-600 whitespace-nowrap">{t.topic}</td>
                    <td className="whitespace-nowrap">{t.lesson_name}</td>
                    <td className="whitespace-nowrap">{t.subject_name}</td>
                    <td className="whitespace-nowrap">{t.exam_name}</td>
                    <td className="whitespace-nowrap">{t.lang_name}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1 text-xs">
                        {t.topic_doc && t.topic_doc.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            📄 {t.topic_doc.length}
                          </span>
                        )}
                        {t.topic_audio && t.topic_audio.length > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            🎵 {t.topic_audio.length}
                          </span>
                        )}
                        {t.topic_video && t.topic_video.length > 0 && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            🎬 {t.topic_video.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          onClick={() => handleEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          onClick={() => handleDelete(t.topicid!)}
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
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingTopic ? 'Edit Topic' : 'Add Topic'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingTopic ? 'Update topic details below' : 'Enter details to create a new topic'}
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
                    onChange={e => setFormData({ ...formData, langid: Number(e.target.value), examid: undefined, subjectid: undefined, lessonid: undefined })}
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
                    onChange={e => setFormData({ ...formData, examid: Number(e.target.value), subjectid: undefined, lessonid: undefined })}
                  >
                    <option value="">Select Exam</option>
                    {filteredExams.map(ex => <option key={ex.examid} value={ex.examid}>{ex.exam}</option>)}
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
                    required
                    value={formData.subjectid || ''}
                    disabled={!formData.examid}
                    onChange={e => setFormData({ ...formData, subjectid: Number(e.target.value), lessonid: undefined })}
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
                    onChange={e => setFormData({ ...formData, lessonid: Number(e.target.value) })}
                  >
                    <option value="">Select Lesson</option>
                    {filteredLessons.map(l => <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>)}
                  </select>
                  {!formData.subjectid && (
                    <p className="text-xs text-gray-500 mt-1">Please select a subject first</p>
                  )}
                </div>

                {/* Topic Name (Fifth) */}
                <div>
                  <label className="form-label">Topic Name *</label>
                  <input
                    className="form-input"
                    value={formData.topic || ''}
                    required
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  />
                </div>

                {/* Explanation - TinyMCE Editor */}
                <div>
                  <label className="form-label">Explanation</label>
                  <Editor
                    onInit={(_evt: any, editor: any) => explainEditorRef.current = editor}
                    initialValue={formData.explain || ''}
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
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'doc' ? '⏳ Uploading...' : '📁 Browse Document'}
                      </label>
                    </div>
                    {formData.topic_doc && formData.topic_doc.length > 0 && (
                      <div className="space-y-1">
                        {formData.topic_doc.map((doc, idx) => (
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
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'audio' ? '⏳ Uploading...' : '🎵 Browse Audio'}
                      </label>
                    </div>
                    {formData.topic_audio && formData.topic_audio.length > 0 && (
                      <div className="space-y-1">
                        {formData.topic_audio.map((audio, idx) => (
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
                        className={`px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition ${uploading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading === 'video' ? '⏳ Uploading...' : '🎬 Browse Video'}
                      </label>
                    </div>
                    {formData.topic_video && formData.topic_video.length > 0 && (
                      <div className="space-y-1">
                        {formData.topic_video.map((video, idx) => (
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
                  {uploading !== null ? 'Please wait...' : editingTopic ? 'Update Topic' : 'Create Topic'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}