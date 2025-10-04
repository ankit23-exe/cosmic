import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ShareIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Publication {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  journal: string;
  image: string;
  tags: string[];
}

const SearchResults: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    year: 'all',
    organism: 'all',
    mission: 'all'
  });

  const publications: Publication[] = [
    {
      id: '1',
      title: 'Arabidopsis Gene Expression in Microgravity Conditions',
      abstract: 'This study examines the effects of microgravity on plant gene expression patterns, revealing significant changes in stress response pathways...',
      authors: ['Dr. Sarah Johnson', 'Dr. Michael Chen'],
      year: 2023,
      journal: 'Space Biology Quarterly',
      image: 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Microgravity', 'Plant Biology', 'Gene Expression']
    },
    {
      id: '2',
      title: 'Radiation Effects on DNA Repair Mechanisms in Space',
      abstract: 'Investigation of how cosmic radiation impacts cellular DNA repair processes during long-duration spaceflight missions...',
      authors: ['Dr. Lisa Rodriguez', 'Dr. James Wong'],
      year: 2022,
      journal: 'Astrobiology Review',
      image: 'https://images.pexels.com/photos/3937174/pexels-photo-3937174.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Radiation', 'DNA Repair', 'Space Medicine']
    },
    {
      id: '3',
      title: 'Muscle Atrophy Prevention in Mars Mission Analog Studies',
      abstract: 'Comprehensive analysis of exercise countermeasures and their effectiveness in preventing muscle degradation during simulated Mars missions...',
      authors: ['Dr. Maria Gonzalez', 'Dr. Robert Kim'],
      year: 2023,
      journal: 'Mars Research Today',
      image: 'https://images.pexels.com/photos/40824/muscles-anatomy-body-muscle-40824.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Mars Analog', 'Muscle Atrophy', 'Exercise Countermeasures']
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const sharePublication = (publication: Publication) => {
  const message = `Check out this NASA research: "${publication.title}" from Cosmic Space Biology Intelligence Engine`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n' + window.location.href)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
  <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen bg-[color:var(--bg-root)] text-[color:var(--text-primary)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-6 text-[color:var(--text-primary)]">NASA Publications</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search publications, authors, keywords..."
                className="neutral-input w-full px-6 py-3 pl-12 placeholder-[color:var(--text-dim)] rounded-lg"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <motion.button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-1.5 neutral-button font-medium rounded-md"
              >
                Search
              </motion.button>
            </div>
          </form>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="neutral-surface rounded-xl p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <FunnelIcon className="w-5 h-5 mr-2 text-[color:var(--text-secondary)]" />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Publication Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="w-full px-3 py-2 bg-[color:var(--bg-alt-2)] border border-[color:var(--border-color)] rounded-lg text-[color:var(--text-primary)] focus:border-[color:var(--accent-hover)] focus:outline-none"
                  >
                    <option value="all">All Years</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organism Type
                  </label>
                  <select
                    value={filters.organism}
                    onChange={(e) => setFilters({ ...filters, organism: e.target.value })}
                    className="w-full px-3 py-2 bg-[color:var(--bg-alt-2)] border border-[color:var(--border-color)] rounded-lg text-[color:var(--text-primary)] focus:border-[color:var(--accent-hover)] focus:outline-none"
                  >
                    <option value="all">All Organisms</option>
                    <option value="plants">Plants</option>
                    <option value="microbes">Microbes</option>
                    <option value="animals">Animals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mission Context
                  </label>
                  <select
                    value={filters.mission}
                    onChange={(e) => setFilters({ ...filters, mission: e.target.value })}
                    className="w-full px-3 py-2 bg-[color:var(--bg-alt-2)] border border-[color:var(--border-color)] rounded-lg text-[color:var(--text-primary)] focus:border-[color:var(--accent-hover)] focus:outline-none"
                  >
                    <option value="all">All Missions</option>
                    <option value="iss">ISS Research</option>
                    <option value="mars">Mars Analog</option>
                    <option value="lunar">Lunar Studies</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-[color:var(--text-secondary)]">
                Found {publications.length} publications
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Sort by:</span>
                <select className="px-3 py-1 bg-[color:var(--bg-alt-2)] border border-[color:var(--border-color)] rounded text-[color:var(--text-primary)] text-sm focus:border-[color:var(--accent-hover)] focus:outline-none">
                  <option>Relevance</option>
                  <option>Year (Newest)</option>
                  <option>Year (Oldest)</option>
                  <option>Title A-Z</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {publications.map((publication, index) => (
                <motion.div
                  key={publication.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="neutral-surface rounded-xl p-6 hover:border-[color:var(--accent-hover)] transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    <div className="md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-[color:var(--bg-alt-2)] border border-[color:var(--border-color)]">
                      <img
                        src={publication.image}
                        alt={publication.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-[color:var(--text-primary)] hover:text-[color:var(--text-secondary)] cursor-pointer">
                          {publication.title}
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => sharePublication(publication)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <ShareIcon className="w-5 h-5" />
                        </motion.button>
                      </div>

                      <div className="flex items-center space-x-4 mb-3 text-sm text-[color:var(--text-secondary)]">
                        <span>{publication.authors.join(', ')}</span>
                        <span>•</span>
                        <span>{publication.year}</span>
                        <span>•</span>
                        <span>{publication.journal}</span>
                      </div>

                      <p className="text-[color:var(--text-secondary)] mb-4 line-clamp-2">
                        {publication.abstract}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {publication.tags.map((tag) => (
                            <span
                              key={tag}
                              className="neutral-chip"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="neutral-button px-6 py-2 font-medium rounded-lg"
                        >
                          Explore
                        </motion.button>
                      </div>

                      {/* Mini Chart Placeholder */}
                      <div className="mt-4 h-16 bg-[color:var(--bg-alt-2)] rounded border border-[color:var(--border-color)] flex items-center justify-center">
                        <span className="text-xs text-[color:var(--text-dim)]">Data Visualization Preview</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 neutral-button rounded-lg font-medium"
              >
                Load More Results
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;