'use client';

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚧</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Under Development</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This module is ready to be implemented following the same pattern as Exams and Subjects.</p>
                <p className="mt-2">Check <strong>CODE_TEMPLATES.md</strong> for quick implementation guide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
