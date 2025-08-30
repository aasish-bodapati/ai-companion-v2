'use client';

import Link from 'next/link';

export default function TrackersPage() {
  const items: { key: string; title: string; desc: string; href: string; emoji: string }[] = [
    { key: 'hydration', title: 'Hydration', desc: 'Record daily water intake', href: '/trackers/hydration', emoji: '💧' },
    { key: 'mood', title: 'Mood', desc: 'Check in on your mood', href: '/trackers/mood', emoji: '🙂' },
    { key: 'journal', title: 'Journal', desc: 'Daily journaling', href: '/trackers/journal', emoji: '📓' },
    { key: 'reviews', title: 'Reviews', desc: 'Daily suggestions and weekly summary', href: '/trackers/reviews', emoji: '🧠' },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Trackers</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Capture daily health and habit signals. Choose a tracker to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl" aria-hidden>
                    {it.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{it.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{it.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            Note: These pages are scaffolded. We'll wire forms and lists to backend coaching tracker endpoints next.
          </div>
        </div>
      </div>
    </div>
  );
}
