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
      const [topicsRes, examsRes, subjectsRes, lessonsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/exams'),
        fetch('/api/subjects'),
        fetch('/api/lessons'),
      ]);

      const topicsData = await topicsRes.json();
      const examsData = await examsRes.json();
      const subjectsData = await subjectsRes.json();
      const lessonsData = await lessonsRes.json();

      if (topicsData.success) setTopics(topicsData.data);
      if (examsData.success) setExams(examsData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
      if (lessonsData.success) setLessons(lessonsData.data);

    } catch (err) {
      alert('Error loading topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingTopic ? 'PUT' : 'POST';
    const body = editingTopic
      ? { ...formData, topicid: editingTopic.topicid }
      : formData;

    const res = await fetch('/api/topics', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setEditingTopic(null);
      fetchAll();
    } else alert(data.error);
  };

  const handleDelete = async (topicid: number) => {
    if (!confirm('Delete topic?')) return;

    const res = await fetch(`/api/topics?topicid=${topicid}&euserid=1`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (data.success) fetchAll();
  };

  const openAddModal = () => {
    setEditingTopic(null);
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
    setFormData({
      langid: t.langid,
      lessonid: t.lessonid,
      topic: t.topic,
      explain: t.explain,
      topic_doc: t.topic_doc || '',
      topic_audio: t.topic_audio || '',
      topic_video: t.topic_video || '',
      euserid: 1,
    });
    setShowModal(true);
  };

  if (loading) return <div>Loading...</div>;

  const filteredSubjects = subjects.filter(s => s.examid === Number(selectedExam));
  const filteredLessons = lessons.filter(l => l.subjectid === Number(selectedSubject));

  return (
    <div>
      <div className="flex justify-between mb-6">
       <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold text-gray-800">Topics Management</h1>
  </div>
  


        <button onClick={openAddModal} className="btn btn-primary">
          + Add New Topic
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Topic</th>
              <th>Lesson</th>
              <th>Subject</th>
              <th>Exam</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map(t => (
              <tr key={t.topicid}>
                <td>{t.topicid}</td>
                <td>{t.topic}</td>
                <td>{t.lesson_name}</td>
                <td>{t.subject_name}</td>
                <td>{t.exam_name}</td>
                <td className="flex gap-2">
                  <button onClick={() => handleEdit(t)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(t.topicid!)} className="px-3 py-1 bg-red-100 text-red-700 rounded">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">{editingTopic ? 'Edit Topic' : 'Add Topic'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value ? Number(e.target.value) : '')}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    {exams.map(e => <option key={e.examid} value={e.examid}>{e.exam}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    {filteredSubjects.map(s => <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Lesson *</label>
                  <select
                    required
                    value={formData.lessonid}
                    onChange={(e) => setFormData({ ...formData, lessonid: Number(e.target.value) })}
                    className="form-select"
                  >
                    <option value="">Select</option>
                    {filteredLessons.map(l => <option key={l.lessonid} value={l.lessonid}>{l.lesson}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Topic Name *</label>
                <input className="form-input" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} required />
              </div>

              <div>
                <label className="form-label">Explanation</label>
                <textarea className="form-textarea" rows={3} value={formData.explain} onChange={(e) => setFormData({ ...formData, explain: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Document URL</label>
                  <input className="form-input" value={formData.topic_doc} onChange={(e) => setFormData({ ...formData, topic_doc: e.target.value })} />
                </div>

                <div>
                  <label className="form-label">Audio URL</label>
                  <input className="form-input" value={formData.topic_audio} onChange={(e) => setFormData({ ...formData, topic_audio: e.target.value })} />
                </div>

                <div>
                  <label className="form-label">Video URL</label>
                  <input className="form-input" value={formData.topic_video} onChange={(e) => setFormData({ ...formData, topic_video: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingTopic ? 'Update' : 'Create'}
                </button>
                <button onClick={() => setShowModal(false)} type="button" className="btn btn-secondary flex-1">
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
