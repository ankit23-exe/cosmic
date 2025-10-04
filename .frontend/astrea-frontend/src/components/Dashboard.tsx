import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/chat?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
  <div className="relative min-h-screen overflow-hidden bg-[color:var(--bg-root)] text-[color:var(--text-primary)]">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        data-default-video="/bg-professional.mp4"
        className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none select-none"
        onError={(e) => {
          const el = e.currentTarget;
          // Try alternate source once
          if (!el.dataset.fallbackTried) {
            el.dataset.fallbackTried = 'true';
            el.src = '/bg-pro-alt.mp4';
            el.load();
            el.play().catch(()=>{});
          } else {
            el.style.display = 'none';
            const existing = document.getElementById('video-fallback-bg');
            if (!existing) {
              const div = document.createElement('div');
              div.id = 'video-fallback-bg';
              div.style.position = 'fixed';
              div.style.inset = '0';
              div.style.background = 'radial-gradient(circle at 30% 40%, #1a1f24 0%, #0c0e11 70%)';
              div.style.zIndex = '0';
              document.body.appendChild(div);
            }
          }
        }}
      >
        <source src="/bg-professional.mp4" type="video/mp4" />
        <source src="/bg-pro-alt.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 z-0" style={{ background: 'var(--video-overlay)' }} />
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-[color:var(--text-primary)]">Cosmic</h1>
          <p className="text-xl md:text-2xl text-[color:var(--text-secondary)] mb-4">
            Space Biology Knowledge Engine
          </p>
          <p className="text-lg text-[color:var(--text-dim)] mb-12 max-w-3xl mx-auto">
            Exploring NASA's Space Bioscience for the Next Era of Human Exploration
          </p>
          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 600+ NASA Publications..."
                className="neutral-input w-full px-6 py-4 pl-14 text-lg placeholder-[color:var(--text-dim)] focus:ring-0 focus:border-[color:var(--accent)]"
              />
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-8 py-2 neutral-button rounded-full font-medium shadow-sm"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Knowledge Graph',
                description: 'Explore interconnected research through interactive network visualizations',
                icon: '🕸️',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Publications',
                description: 'Search and discover NASA space biology research papers',
                icon: '📚',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                title: 'Hypotheses',
                description: 'AI-powered hypothesis generation based on existing research',
                icon: '💡',
                gradient: 'from-green-500 to-teal-500'
              },
              {
                title: 'Visualizations',
                description: 'Interactive charts and data insights from space biology studies',
                icon: '📊',
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="relative p-6 neutral-surface rounded-xl hover:border-[color:var(--accent-hover)] transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-[color:var(--bg-surface-alt)] border border-[color:var(--border-color)] shadow-sm">
                  <span className="text-2xl text-[color:var(--text-secondary)]">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[color:var(--text-dim)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Explorer */}
  <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 tracking-tight text-[color:var(--text-primary)]">Impact Explorer</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover how space biology research shapes Moon and Mars mission planning
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {[
              {
                title: 'Moon Mission Relevance',
                icon: '🌙',
                items: ['Lunar habitat biology', 'Low gravity effects', 'Life support systems']
              },
              {
                title: 'Mars Mission Planning',
                icon: '🔴',
                items: ['Long-duration spaceflight', 'Radiation protection', 'Closed-loop ecosystems']
              }
            ].map((section) => (
              <div
                key={section.title}
                className="neutral-surface rounded-xl p-8"
              >
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">{section.icon}</span>
                  <h3 className="text-2xl font-bold text-white">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center text-[color:var(--text-secondary)]">
                      <div className="w-2 h-2 bg-[color:var(--accent-hover)] rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Gaps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6 tracking-tight text-[color:var(--text-primary)]">Knowledge Gaps</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Critical areas where more research is needed for successful space exploration
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                'Microgravity plant biology',
                'Space radiation effects on DNA',
                'Psychological adaptation to isolation'
              ].map((gap) => (
                <div
                  key={gap}
                  className="p-6 neutral-surface rounded-xl"
                >
                  <p className="text-lg text-[color:var(--text-secondary)] font-medium">{gap}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;