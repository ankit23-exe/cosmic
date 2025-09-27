import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, ShareIcon } from '@heroicons/react/24/outline';
import SocialShare from './shared/SocialShare';

interface Node {
  id: string;
  label: string;
  type: 'organism' | 'mission' | 'dataset';
  x: number;
  y: number;
  connections: string[];
}

const KnowledgeGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filters, setFilters] = useState({
    organism: true,
    mission: true,
    dataset: true,
    year: 'all'
  });

  const nodes: Node[] = [
    { id: '1', label: 'Arabidopsis', type: 'organism', x: 200, y: 150, connections: ['2', '4'] },
    { id: '2', label: 'ISS Research', type: 'mission', x: 400, y: 200, connections: ['1', '3'] },
    { id: '3', label: 'Gene Expression', type: 'dataset', x: 600, y: 100, connections: ['2', '5'] },
    { id: '4', label: 'Plant Growth', type: 'dataset', x: 150, y: 350, connections: ['1', '5'] },
    { id: '5', label: 'Mars Analog', type: 'mission', x: 500, y: 400, connections: ['3', '4'] },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      
      nodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const connectedNode = nodes.find(n => n.id === connectionId);
          if (connectedNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connectedNode.x, connectedNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const colors = {
          organism: { main: '#10B981', glow: 'rgba(16, 185, 129, 0.3)' },
          mission: { main: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
          dataset: { main: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' }
        };

        const color = colors[node.type];

        // Draw glow effect
        ctx.shadowColor = color.glow;
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = color.main;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 40);
      });
    };

    draw();

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedNode = nodes.find(node => {
        const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
        return distance <= 25;
      });

      if (clickedNode) {
        setSelectedNode(clickedNode);
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Knowledge Graph Explorer
              </h1>
              <p className="text-gray-400">Interactive visualization of research connections</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <SocialShare 
                title="ASTREA Knowledge Graph"
                description="Explore interconnected space biology research"
              />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <FunnelIcon className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
              </div>

              <div className="space-y-6">
                {/* Node Type Filters */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Node Types</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'organism', label: 'Organisms', color: 'bg-green-500' },
                      { key: 'mission', label: 'Missions', color: 'bg-blue-500' },
                      { key: 'dataset', label: 'Datasets', color: 'bg-purple-500' }
                    ].map((filter) => (
                      <label key={filter.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters[filter.key as keyof typeof filters] as boolean}
                          onChange={(e) =>
                            setFilters({ ...filters, [filter.key]: e.target.checked })
                          }
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 ${filter.color} rounded mr-3`}></div>
                        <span className="text-gray-300">{filter.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Year Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Year Range</h3>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Years</option>
                    <option value="2020-2024">2020-2024</option>
                    <option value="2015-2019">2015-2019</option>
                    <option value="2010-2014">2010-2014</option>
                  </select>
                </div>
              </div>

              {/* Share Insight Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200"
                onClick={() => {
                  const message = `Check out this insight from ASTREA Knowledge Graph: ${selectedNode ? selectedNode.label : 'Interactive research network visualization'}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n' + window.location.href)}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                <ShareIcon className="w-4 h-4 inline mr-2" />
                Share Insight
              </motion.button>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">Node Details</h3>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Name:</span> {selectedNode.label}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Type:</span> {selectedNode.type}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Connections:</span> {selectedNode.connections.length}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Graph Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-3"
          >
            <div className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Research Network</h2>
                <div className="text-sm text-gray-400">
                  Click nodes to explore connections
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-96 border border-gray-700 rounded-lg cursor-pointer"
                  style={{ background: 'linear-gradient(45deg, #0f1419, #1a1f2e)' }}
                />
                
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-2">Legend</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-300">Organisms</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-300">Missions</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-gray-300">Datasets</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graph Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Reset View
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Auto Layout
                  </motion.button>
                </div>
                
                <div className="text-sm text-gray-400">
                  {nodes.length} nodes • {nodes.reduce((acc, node) => acc + node.connections.length, 0) / 2} connections
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;