'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '📚', label: 'Exams', path: '/exams' },
    { icon: '📖', label: 'Subjects', path: '/subjects' },
    { icon: '📝', label: 'Units', path: '/units' },
    { icon: '📄', label: 'Lessons', path: '/lessons' },
    { icon: '💡', label: 'Topics', path: '/topics' },
    { icon: '❓', label: 'Questions', path: '/questions' },
    { icon: '✅', label: 'MCQs', path: '/mcqs' },
    { icon: '👨‍🏫', label: 'Teachers', path: '/teachers' },
    { icon: '👨‍🎓', label: 'Learners', path: '/learners' },
    { icon: '📊', label: 'Tests', path: '/tests' },
  ];

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold">CMS Admin</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-800 transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors ${
                isActive ? 'bg-primary-600 border-l-4 border-white' : ''
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-2xl">{item.icon}</span>
              {!collapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed && (
          <div className="text-sm text-gray-400">
            <p className="font-semibold">Learn Saubh CMS</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
