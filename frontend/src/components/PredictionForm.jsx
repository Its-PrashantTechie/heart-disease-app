import React, { useState } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const PredictionForm = ({ selectedModel }) => {
    const [formData, setFormData] = useState({
        Age: 50,
        Sex: 'M',
        ChestPainType: 'ASY',
        RestingBP: 120,
        Cholesterol: 200,
        FastingBS: 0,
        RestingECG: 'Normal',
        MaxHR: 150,
        ExerciseAngina: 'N',
        Oldpeak: 0.0,
        ST_Slope: 'Flat'
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['Age', 'RestingBP', 'Cholesterol', 'FastingBS', 'MaxHR', 'Oldpeak'].includes(name)
                ? parseFloat(value)
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(`${API_URL}/predict?model_name=${encodeURIComponent(selectedModel)}`, formData);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Execution failed. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <form onSubmit={handleSubmit}>
                <div className="grid">
                    <div className="form-group">
                        <label>Age</label>
                        <input type="number" name="Age" value={formData.Age} onChange={handleChange} min="1" max="120" required />
                    </div>
                    <div className="form-group">
                        <label>Sex</label>
                        <select name="Sex" value={formData.Sex} onChange={handleChange}>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Chest Pain Type</label>
                        <select name="ChestPainType" value={formData.ChestPainType} onChange={handleChange}>
                            <option value="ATA">Atypical Angina</option>
                            <option value="NAP">Non-Anginal Pain</option>
                            <option value="ASY">Asymptomatic</option>
                            <option value="TA">Typical Angina</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Resting Blood Pressure</label>
                        <input type="number" name="RestingBP" value={formData.RestingBP} onChange={handleChange} min="60" max="250" required />
                    </div>
                    <div className="form-group">
                        <label>Cholesterol</label>
                        <input type="number" name="Cholesterol" value={formData.Cholesterol} onChange={handleChange} min="80" max="600" required />
                    </div>
                    <div className="form-group">
                        <label>Fasting Blood Sugar {'>'} 120 mg/dl</label>
                        <select name="FastingBS" value={formData.FastingBS} onChange={handleChange}>
                            <option value={0}>No</option>
                            <option value={1}>Yes</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Resting ECG</label>
                        <select name="RestingECG" value={formData.RestingECG} onChange={handleChange}>
                            <option value="Normal">Normal</option>
                            <option value="ST">ST-T Wave Abnormality</option>
                            <option value="LVH">Left Ventricular Hypertrophy</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Max Heart Rate</label>
                        <input type="number" name="MaxHR" value={formData.MaxHR} onChange={handleChange} min="50" max="220" required />
                    </div>
                    <div className="form-group">
                        <label>Exercise Induced Angina</label>
                        <select name="ExerciseAngina" value={formData.ExerciseAngina} onChange={handleChange}>
                            <option value="N">No</option>
                            <option value="Y">Yes</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>ST Depression (Oldpeak)</label>
                        <input type="number" step="0.1" name="Oldpeak" value={formData.Oldpeak} onChange={handleChange} min="-5" max="10" required />
                    </div>
                    <div className="form-group">
                        <label>ST Slope</label>
                        <select name="ST_Slope" value={formData.ST_Slope} onChange={handleChange}>
                            <option value="Up">Upward</option>
                            <option value="Flat">Flat</option>
                            <option value="Down">Downward</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Analyzing Neural Pathways...' : 'Run Diagnostics'}
                </button>
            </form>

            {error && (
                <div className="result-card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                    <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="result-card animate-fade-in">
                    <Activity size={40} className={result.prediction === 1 ? 'risk-high' : 'risk-low'} style={{ marginBottom: '1rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Result: <span className={result.prediction === 1 ? 'risk-high' : 'risk-low'}>{result.risk} Risk</span></h2>

                    {result.probability !== null && (
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Confidence Score: {(result.probability * 100).toFixed(1)}%</p>
                            <div className="probability-bar">
                                <div
                                    className="probability-fill"
                                    style={{ width: `${result.probability * 100}%`, background: result.prediction === 1 ? 'var(--danger)' : 'var(--success)' }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                        Model Used: {result.model}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PredictionForm;
