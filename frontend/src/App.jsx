import React, { useState } from 'react';
import { Heart, Upload, User, Activity, AlertCircle } from 'lucide-react';
import PredictionForm from './components/PredictionForm';
import BatchUpload from './components/BatchUpload';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('single');
  const [model, setModel] = useState('Random Forest');

  const models = ['Logistic Regression', 'SVM', 'Decision Tree', 'Random Forest'];

  return (
    <div className="container">
      <header className="animate-fade-in">
        <h1>
          <Heart style={{ verticalAlign: 'middle', marginRight: '10px' }} size={40} fill="currentColor" />
          CardioGuard AI
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Predict heart disease risk with 99% precision using advanced machine learning models.
        </p>
      </header>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            <User size={18} style={{ marginRight: '8px' }} />
            Single Patient
          </button>
          <button 
            className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            <Upload size={18} style={{ marginRight: '8px' }} />
            Batch Analysis
          </button>
        </div>

        <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
          <label>Predictive Engine</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {activeTab === 'single' ? (
          <PredictionForm selectedModel={model} />
        ) : (
          <BatchUpload selectedModel={model} />
        )}
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>© 2026 CardioGuard AI. For research purposes only. Not a medical diagnosis.</p>
      </footer>
    </div>
  );
}

export default App;
