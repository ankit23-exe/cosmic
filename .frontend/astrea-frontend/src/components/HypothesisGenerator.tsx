import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LightBulbIcon, ShareIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  supportingPublications: string[];
  keyFactors: string[];
}

const HypothesisGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHypotheses, setGeneratedHypotheses] = useState<Hypothesis[]>([]);

  const sampleHypotheses: Hypothesis[] = [
    {
      id: '1',
      title: 'Enhanced Root Growth in Microgravity Environments',
      description: 'Plants may develop enhanced root systems in microgravity to compensate for altered gravitropic responses, potentially leading to more efficient nutrient absorption.',
      confidence: 87,
      supportingPublications: ['Arabidopsis root behavior in space', 'ISS plant growth studies', 'Microgravity biology research'],
      keyFactors: ['Gravitropic response', 'Nutrient uptake', 'Cell elongation']
    },
    {
      id: '2',
      title: 'Accelerated Protein Crystallization in Space',
      description: 'The microgravity environment may facilitate better protein crystal formation, leading to improved drug development and therapeutic applications.',
      confidence: 92,
      supportingPublications: ['Protein crystallization experiments', 'ISS laboratory results', 'Pharmaceutical research in space'],
      keyFactors: ['Crystal quality', 'Microgravity effects', 'Pharmaceutical applications']
    }
  ];

  const generateHypothesis = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      setGeneratedHypotheses(sampleHypotheses);
      setIsGenerating(false);
    }, 2000);
  };

  const shareHypothesis = (hypothesis: Hypothesis) => {
  const message = `AI-Generated Space Biology Hypothesis from Cosmic:\n\n"${hypothesis.title}"\n\n${hypothesis.description}\n\nConfidence: ${hypothesis.confidence}%`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n\n' + window.location.href)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4"
            >
              <LightBulbIcon className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
            AI Hypothesis Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Propose research questions and let AI generate evidence-based hypotheses from space biology literature
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-8">
            <label className="block text-lg font-medium text-white mb-4">
              Describe your research interest or question:
            </label>
            
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., How does microgravity affect plant root development and nutrient absorption?"
                className="w-full px-6 py-4 bg-black/50 border border-gray-600 rounded-lg backdrop-blur-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-400 resize-none"
                rows={4}
              />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateHypothesis}
                disabled={!inputText.trim() || isGenerating}
                className={`mt-4 w-full px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                  inputText.trim() && !isGenerating
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                    Generating Hypotheses...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LightBulbIcon className="w-5 h-5 mr-2" />
                    Generate AI Hypotheses
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Generated Hypotheses */}
        <AnimatePresence>
          {generatedHypotheses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Generated Hypotheses
              </h2>

              {generatedHypotheses.map((hypothesis, index) => (
                <motion.div
                  key={hypothesis.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md border border-blue-500/30 rounded-xl p-8 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white pr-4">
                      {hypothesis.title}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        hypothesis.confidence >= 90 ? 'bg-green-500/20 text-green-300' :
                        hypothesis.confidence >= 70 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {hypothesis.confidence}% confidence
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => shareHypothesis(hypothesis)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Share Hypothesis"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-6">
                    {hypothesis.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key Factors */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                        Key Factors
                      </h4>
                      <div className="space-y-2">
                        {hypothesis.keyFactors.map((factor) => (
                          <div key={factor} className="flex items-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                            <span className="text-gray-300">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Supporting Publications */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                        Supporting Research
                      </h4>
                      <div className="space-y-2">
                        {hypothesis.supportingPublications.map((pub) => (
                          <div key={pub} className="flex items-center">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                            <span className="text-gray-300 text-sm hover:text-white cursor-pointer">
                              {pub}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Explore Evidence
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Related Research
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareHypothesis(hypothesis)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Share Hypothesis
                    </motion.button>
                  </div>

                  {/* Visual Representation */}
                  <div className="mt-6 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 flex items-center justify-center">
                    <div className="text-center">
                      <SparklesIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-400">Hypothesis Visualization</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample Questions */}
        {generatedHypotheses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-black/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-8"
          >
            <h3 className="text-lg font-semibold text-white mb-6">
              Try these sample research questions:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "How does microgravity affect plant root development?",
                "What are the effects of cosmic radiation on DNA repair?",
                "How do muscle cells adapt to weightlessness?",
                "What happens to bone density during long space missions?"
              ].map((question) => (
                <motion.button
                  key={question}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputText(question)}
                  className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg text-left hover:border-blue-500/50 transition-all duration-200"
                >
                  <p className="text-gray-300">{question}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HypothesisGenerator;