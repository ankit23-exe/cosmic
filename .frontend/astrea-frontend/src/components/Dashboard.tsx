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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-60 pointer-events-none"
        src="/background-video.mp4"
      />
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ASTREA
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            Space Biology Knowledge Engine
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
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
                className="w-full px-6 py-4 pl-14 text-lg bg-black/50 border-2 border-blue-500/30 rounded-full backdrop-blur-md focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-white placeholder-gray-400 transition-all duration-300"
              />
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
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
                className="relative p-6 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:border-white/20 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg mb-4`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Explorer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Impact Explorer
            </h2>
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
                className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8"
              >
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">{section.icon}</span>
                  <h3 className="text-2xl font-bold text-white">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
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
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Knowledge Gaps
            </h2>
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
                  className="p-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl backdrop-blur-md"
                >
                  <p className="text-lg text-white font-medium">{gap}</p>
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