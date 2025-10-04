import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  LightBulbIcon,
  ShareIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import SocialShare from './shared/SocialShare';
// import WhatsAppFloat from './shared/WhatsAppFloat';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Knowledge Graph', href: '/knowledge-graph', icon: ShareIcon },
    { name: 'Publications', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'Hypotheses', href: '/hypotheses', icon: LightBulbIcon },
    { name: 'Visualizations', href: '/visualizations', icon: ChartBarIcon },
  ];

  return (
  <div className="relative z-10 bg-grid text-[color:var(--text-primary)] min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
  className="relative z-20 bg-[color:var(--bg-alt)]/90 backdrop-blur-md border-b border-[color:var(--border-color)] shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <motion.div whileHover={{ scale: 1.05 }} className="w-10 h-10 rounded-md flex items-center justify-center bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] shadow-sm">
             <span className="font-bold text-sm tracking-wide text-[color:var(--cyan-accent)]">COS</span>
              </motion.div>
              <h1 className="text-xl font-semibold tracking-wide text-[color:var(--text-primary)]">Cosmic</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-200 border ${isActive ? 'bg-[color:var(--bg-surface-alt)] border-[color:var(--accent)] text-[color:var(--text-primary)] shadow-sm' : 'border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)] hover:border-[color:var(--border-color)]'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Social Share & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <SocialShare />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4"
            >
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </motion.nav>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Footer removed per user request */}
    </div>
  );
};

export default Layout;