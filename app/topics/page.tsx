'use client';

import { useEffect, useState } from 'react';
import { Exam, Subject, Lesson, Topic } from '@/types/database';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');

  const [formData, setFormData] = useState<Partial<Topic>>({
    langid: 1,
    lessonid: 0,
    topic: '',
    explain: '',
    topic_doc: '',
    topic_audio: '',
    topic_video: '',
    euserid: 1,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [t, e, s, l] = await Promise.all([
        fetch('/api/topics').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/lessons').then(r => r.json()),
      ]);

      if (t.success) setTopics(t.data);
      if (e.success) setExams(e.data);
      if (s.success) setSubjects(s.data);
      if (l.success) setLessons(l.data);

    } catch (err) {
      console.error('Failed to load Topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lessonid) {
      alert("Please select a lesson");
      return;
    }

    const method = editingTopic ? 'PUT' : 'POST';
    const body = editingTopic
      ? { ...formData, topicid: editingTopic.topicid }
      : formData;

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
    } else alert(d.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete topic?')) return;
    await fetch(`/api/topics?topicid=${id}&euserid=1`, { method: 'DELETE' });
    fetchAll();
  };

  const openAddModal = () => {
    setEditingTopic(null);
    setSelectedExam('');
    setSelectedSubject('');
    setFormData({
      langid: 1,
      lessonid: 0,
      topic: '',
      explain: '',
      topic_doc: '',
      topic_audio: '',
      topic_video: '',
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleEdit = (t: Topic) => {
    setEditingTopic(t);

    // Auto filter prefill
    setSelectedExam(t.examid || '');
    setSelectedSubject(t.subjectid || '');

    setFormData({
      langid: t.langid,
      lessonid: t.lessonid,
      topic: t.topic,
      explain: t.explain,
      topic_doc: t.topic_doc ?? '',
      topic_audio: t.topic_audio ?? '',
      topic_video: t.topic_video ?? '',
      euserid: 1,
    });

    setShowModal(true);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  const filteredSubjects = subjects.filter(s => s.examid === Number(selectedExam));
  const filteredLessons = lessons.filter(l => l.subjectid === Number(selectedSubject));

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Topics Management</h1>
        <button onClick={openAddModal} className="btn btn-primary">+ Add New Topic</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Topic</th><th>Lesson</th><th>Subject</th><th>Exam</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No Topics Found</td></tr>
            ) : (
              topics.map(t => (
                <tr key={t.topicid}>
                  <td>{t.topicid}</td>
                  <td>{t.topic}</td>
                  <td>{t.lesson_name}</td>
                  <td>{t.subject_name}</td>
                  <td>{t.exam_name}</td>
                  <td className="flex gap-2">
                    <button onClick={() => handleEdit(t)} className="btn btn-secondary">Edit</button>
                    <button onClick={() => handleDelete(t.topicid!)} className="btn btn-danger">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <select className="form-select"
                  value={selectedExam}
                  onChange={e => setSelectedExam(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Exam</option>
                  {exams.map(e => <option key={e.examid} value={e.examid}>{e.exam}</option>)}
                </select>

                <select className="form-select"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Subject</option>
                  {filteredSubjects.map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
                </select>

                <select className="form-select" required
                  value={formData.lessonid || ''}
                  onChange={e => setFormData({ ...formData, lessonid: Number(e.target.value) })}>
                  <option value="">Lesson</option>
                  {filteredLessons.map(l => <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>)}
                </select>
              </div>

              <input className="form-input" placeholder="Topic Name" required
                value={formData.topic ?? ''}
                onChange={e => setFormData({ ...formData, topic: e.target.value })} />

              <textarea className="form-textarea" rows={3}
                value={formData.explain ?? ''}
                onChange={e => setFormData({ ...formData, explain: e.target.value })} />

              <div className="grid grid-cols-3 gap-3">
                <input className="form-input" placeholder="Document URL"
                  value={formData.topic_doc ?? ''}
                  onChange={e => setFormData({ ...formData, topic_doc: e.target.value })} />

                <input className="form-input" placeholder="Audio URL"
                  value={formData.topic_audio ?? ''}
                  onChange={e => setFormData({ ...formData, topic_audio: e.target.value })} />

                <input className="form-input" placeholder="Video URL"
                  value={formData.topic_video ?? ''}
                  onChange={e => setFormData({ ...formData, topic_video: e.target.value })} />
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingTopic ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>
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
