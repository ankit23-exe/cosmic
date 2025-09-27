import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import KnowledgeGraph from './components/KnowledgeGraph';
import SearchResults from './components/SearchResults';
import HypothesisGenerator from './components/HypothesisGenerator';
import DataVisualizations from './components/DataVisualizations';
import StarField from './components/StarField';
import Chat from './components/chat';
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <StarField />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/hypotheses" element={<HypothesisGenerator />} />
            <Route path="/visualizations" element={<DataVisualizations />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;