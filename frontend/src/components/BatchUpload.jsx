import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const BatchUpload = ({ selectedModel }) => {
    const [file, setFile] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('Please upload a valid CSV file.');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResults(null);

        // --- CSV Pre-Validation Logic ---
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n').map(line => line.trim()).filter(line => line !== "");

            if (lines.length < 2) {
                setError("CSV file is empty or missing data.");
                setLoading(false);
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const required = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol', 'MaxHR', 'Oldpeak'];
            const missing = required.filter(h => !headers.includes(h));

            if (missing.length > 0) {
                setError(`Missing required columns: ${missing.join(', ')}`);
                setLoading(false);
                return;
            }

            const limits = {
                'Age': [1, 120],
                'RestingBP': [60, 250],
                'Cholesterol': [80, 600],
                'MaxHR': [50, 220],
                'Oldpeak': [-5, 10]
            };

            for (let i = 1; i < Math.min(lines.length, 51); i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((h, index) => row[h] = values[index]);

                for (const [col, limit] of Object.entries(limits)) {
                    const val = parseFloat(row[col]);
                    if (isNaN(val) || val < limit[0] || val > limit[1]) {
                        setError(`Validation Error: ${col} in Row ${i} is ${row[col]}. Must be between ${limit[0]}-${limit[1]}.`);
                        setLoading(false);
                        return;
                    }
                }
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(
                    `${API_URL}/predict/batch?model_name=${encodeURIComponent(selectedModel)}`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                setResults(response.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Upload failed. Check file format.');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="animate-fade-in">
            {!results ? (
                <div className="batch-upload" onClick={() => document.getElementById('csvInput').click()}>
                    <input
                        type="file"
                        id="csvInput"
                        hidden
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <Upload size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                    <h3>{file ? file.name : 'Drop CSV File Here'}</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Ensure columns match: Age, Sex, ChestPainType, RestingBP, Cholesterol...
                    </p>
                    {file && (
                        <button
                            className="btn-submit"
                            style={{ maxWidth: '200px', margin: '1.5rem auto 0' }}
                            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Start Analysis'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Patients</p>
                                <h2 style={{ color: 'var(--primary)' }}>{results.total_patients}</h2>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>High Risk Detected</p>
                                <h2 style={{ color: 'var(--danger)' }}>{results.high_risk_count}</h2>
                            </div>
                        </div>
                        <button className="tab-btn" onClick={() => setResults(null)}>Analysis New File</button>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient #</th>
                                    <th>Risk Level</th>
                                    <th>Confidence</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.results.map((res) => (
                                    <tr key={res.patient_index}>
                                        <td>Patient {res.patient_index + 1}</td>
                                        <td className={res.prediction === 1 ? 'risk-high' : 'risk-low'}>
                                            {res.risk}
                                        </td>
                                        <td>
                                            {res.probability ? `${(res.probability * 100).toFixed(1)}%` : 'N/A'}
                                        </td>
                                        <td>
                                            {res.prediction === 1 ? (
                                                <AlertCircle size={16} color="var(--danger)" />
                                            ) : (
                                                <CheckCircle2 size={16} color="var(--success)" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {error && (
                <div className="result-card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', marginTop: '1rem' }}>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default BatchUpload;
