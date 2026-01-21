'use client';

import { useEffect, useState } from 'react';
import { Unit, Subject } from '@/types/database';

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<Partial<Unit>>({
    langid: 1,
    subjectid: 0,
    unit: '',
    chapter: '',
    unit_doc: '',
    marks_total: 100,
    euserid: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [unitsRes, subjectsRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/subjects')
      ]);
      
      const unitsData = await unitsRes.json();
      const subjectsData = await subjectsRes.json();
      
      if (unitsData.success) setUnits(unitsData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = '/api/units';
      const method = editingUnit ? 'PUT' : 'POST';
      const body = editingUnit
        ? { ...formData, unitid: editingUnit.unitid }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setShowModal(false);
        setEditingUnit(null);
        resetForm();
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save unit');
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      langid: unit.langid,
      subjectid: unit.subjectid,
      unit: unit.unit,
      chapter: unit.chapter || '',
      unit_doc: unit.unit_doc || '',
      marks_total: unit.marks_total || 100,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (unitid: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      const response = await fetch(`/api/units?unitid=${unitid}&euserid=1`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete unit');
    }
  };

  const resetForm = () => {
    setFormData({
      langid: 1,
      subjectid: 0,
      unit: '',
      chapter: '',
      unit_doc: '',
      marks_total: 100,
      euserid: 1,
    });
  };

  const openAddModal = () => {
    setEditingUnit(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Units Management</h1>
          <p className="text-gray-600 mt-1">Manage units/chapters within subjects</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New Unit
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Unit Name</th>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Chapter</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No units found. Click "Add New Unit" to create one.
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.unitid}>
                    <td className="font-medium">{unit.unitid}</td>
                    <td className="font-semibold text-primary-600">{unit.unit}</td>
                    <td>{unit.subject_name || 'N/A'}</td>
                    <td>{unit.exam_name || 'N/A'}</td>
                    <td>{unit.marks_total || 0}</td>
                    <td className="max-w-xs truncate">{unit.chapter || 'No chapter'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(unit.unitid!)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingUnit ? 'Edit Unit' : 'Add New Unit'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Unit Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Subject *</label>
                      <select
                        className="form-select"
                        value={formData.subjectid}
                        onChange={(e) => setFormData({ ...formData, subjectid: parseInt(e.target.value) })}
                        required
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.subjectid} value={subject.subjectid}>
                            {subject.subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Language ID *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.langid}
                        onChange={(e) => setFormData({ ...formData, langid: parseInt(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="form-label">Total Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.marks_total}
                        onChange={(e) => setFormData({ ...formData, marks_total: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Chapter Content</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Unit Document URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.unit_doc}
                      onChange={(e) => setFormData({ ...formData, unit_doc: e.target.value })}
                      placeholder="https://example.com/document.pdf"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingUnit ? 'Update Unit' : 'Create Unit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUnit(null);
                      resetForm();
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
