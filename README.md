# Heart Disease Analysis & Prediction App

A full-stack application for predicting the likelihood of heart disease using Machine Learning.

## 🚀 Features
- **Machine Learning**: Multiple classifiers (Logistic Regression, SVM, Random Forest, Decision Tree) trained on heart disease data.
- **Backend**: FastAPI providing prediction endpoints and model management.
- **Frontend**: React-based dashboard for interactive data entry and batch uploads.
- **Data Handling**: Handles missing values via KNN Imputation and scaling for optimal performance.

## 🛠️ Tech Stack
- **Backend**: Python, FastAPI, Scikit-Learn, Pandas, Joblib.
- **Frontend**: React, Lucide Icons, Modern CSS.

## 📂 Project Structure
- `backend/`: Python API and ML training scripts.
- `frontend/`: React source code and components.

## ⚙️ Setup
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python train_model.py
   uvicorn main:app --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
