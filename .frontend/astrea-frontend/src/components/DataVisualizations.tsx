import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const DataVisualizations: React.FC = () => {
  const [activeChart, setActiveChart] = useState('trends');

  const chartData = {
    trends: {
      title: 'Research Publication Trends',
      data: [2018, 2019, 2020, 2021, 2022, 2023],
      values: [45, 62, 78, 95, 120, 142]
    },
    organisms: {
      title: 'Research by Organism Type',
      data: ['Plants', 'Microbes', 'Animals', 'Humans'],
      values: [35, 28, 22, 15]
    },
    missions: {
      title: 'Publications by Mission',
      data: ['ISS', 'Mars Analog', 'Lunar Studies', 'Ground Control'],
      values: [55, 25, 12, 8]
    }
  };

  const exportVisualization = (chartType: string) => {
    alert(`Exporting ${chartData[chartType as keyof typeof chartData].title} as image...`);
  };

  const shareVisualization = (chartType: string) => {
    const chart = chartData[chartType as keyof typeof chartData];
    const message = `Check out this data visualization from ASTREA: "${chart.title}"`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n' + window.location.href)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Data Visualizations
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Interactive charts and insights from space biology research data
          </p>
        </motion.div>

        {/* Chart Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'trends', label: 'Yearly Trends', icon: '📈' },
              { key: 'organisms', label: 'Organism Types', icon: '🧬' },
              { key: 'missions', label: 'Mission Data', icon: '🚀' }
            ].map((chart) => (
              <motion.button
                key={chart.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveChart(chart.key)}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                  activeChart === chart.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-black/60 text-gray-300 hover:text-white border border-blue-500/30'
                }`}
              >
                <span className="text-lg mr-2">{chart.icon}</span>
                {chart.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <motion.div
            key={activeChart}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {chartData[activeChart as keyof typeof chartData].title}
                </h2>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => exportVisualization(activeChart)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Export as Image"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => shareVisualization(activeChart)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Share Visualization"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="relative h-96">
                {activeChart === 'trends' && (
                  <div className="h-full flex items-end justify-between space-x-2">
                    {chartData.trends.values.map((value, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / Math.max(...chartData.trends.values)) * 100}%` }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg flex-1 min-h-4 relative group"
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {value}
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                          {chartData.trends.data[index]}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeChart === 'organisms' && (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-80 h-80 relative">
                      {chartData.organisms.data.map((organism, index) => {
                        const percentage = (chartData.organisms.values[index] / chartData.organisms.values.reduce((a, b) => a + b, 0)) * 100;
                        const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
                        
                        return (
                          <motion.div
                            key={organism}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className={`absolute inset-0 rounded-full`}
                            style={{
                              background: `conic-gradient(from ${index * 90}deg, ${colors[index]} 0deg, ${colors[index]} ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`
                            }}
                          />
                        );
                      })}
                      <div className="absolute inset-12 bg-black rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">100%</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeChart === 'missions' && (
                  <div className="h-full space-y-6">
                    {chartData.missions.data.map((mission, index) => {
                      const value = chartData.missions.values[index];
                      const maxValue = Math.max(...chartData.missions.values);
                      const percentage = (value / maxValue) * 100;
                      
                      return (
                        <div key={mission} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">{mission}</span>
                            <span className="text-white font-semibold">{value}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.1, duration: 0.8 }}
                              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pathway Analysis */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Pathway Analysis
              </h3>
              
              <div className="space-y-4">
                {[
                  { from: 'Microgravity', to: 'Gene Expression', strength: 85 },
                  { from: 'Radiation', to: 'DNA Damage', strength: 92 },
                  { from: 'Isolation', to: 'Stress Response', strength: 78 }
                ].map((pathway, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-300">{pathway.from}</span>
                      <span className="text-gray-300">{pathway.to}</span>
                    </div>
                    
                    <div className="relative h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center px-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 to-purple-500/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity" />
                      <div className="w-full flex items-center justify-between relative z-10">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                          className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mx-2 origin-left"
                        />
                        <div className="w-3 h-3 bg-purple-400 rounded-full" />
                      </div>
                      <div className="absolute right-2 text-xs text-white font-medium">
                        {pathway.strength}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                Key Metrics
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'Total Publications', value: '1,247', change: '+18%' },
                  { label: 'Active Researchers', value: '89', change: '+5%' },
                  { label: 'Research Areas', value: '23', change: '+3%' },
                  { label: 'Citations', value: '15,432', change: '+22%' }
                ].map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-gray-400 text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                    </div>
                    <div className="text-green-400 text-sm font-medium">
                      {metric.change}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Export Options */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Export & Share
              </h3>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => exportVisualization(activeChart)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export as PNG
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => shareVisualization(activeChart)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Share on Social Media
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Download Data (CSV)
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualizations;