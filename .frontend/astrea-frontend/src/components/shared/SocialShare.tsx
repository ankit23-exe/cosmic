import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareIcon } from '@heroicons/react/24/outline';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ 
  url = window.location.href,
  title = "ASTREA - Space Biology Knowledge Engine",
  description = "Exploring NASA's Space Bioscience for the Next Era of Human Exploration"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const shareData = {
    url,
    title,
    description
  };

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: '📱',
      color: 'bg-green-600 hover:bg-green-700',
      share: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.title}\n${shareData.description}\n${shareData.url}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      color: 'bg-gray-800 hover:bg-gray-900',
      share: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}`;
        window.open(twitterUrl, '_blank');
      }
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      share: () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
        window.open(linkedinUrl, '_blank');
      }
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      share: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
        window.open(facebookUrl, '_blank');
      }
    },
    {
      name: 'Copy Link',
      icon: '🔗',
      color: 'bg-purple-600 hover:bg-purple-700',
      share: () => {
        navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    }
  ];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200"
      >
        <ShareIcon className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-md border border-blue-500/30 rounded-lg p-2 min-w-48 z-50"
          >
            <div className="grid grid-cols-1 gap-2">
              {socialPlatforms.map((platform) => (
                <motion.button
                  key={platform.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    platform.share();
                    setIsOpen(false);
                  }}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${platform.color} text-white transition-all duration-200`}
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialShare;