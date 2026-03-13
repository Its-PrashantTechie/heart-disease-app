from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
import io
import os
from typing import Dict, Any, List

app = FastAPI(title="Heart Disease Prediction API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and preprocessing objects
MODELS_DIR = "models"
try:
    models = {
        "Logistic Regression": joblib.load(os.path.join(MODELS_DIR, 'logistic_regression.joblib')),
        "SVM": joblib.load(os.path.join(MODELS_DIR, 'svm.joblib')),
        "Decision Tree": joblib.load(os.path.join(MODELS_DIR, 'decision_tree.joblib')),
        "Random Forest": joblib.load(os.path.join(MODELS_DIR, 'random_forest.joblib'))
    }
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.joblib'))
    imputer = joblib.load(os.path.join(MODELS_DIR, 'imputer.joblib'))
    mappings = joblib.load(os.path.join(MODELS_DIR, 'mappings.joblib'))
except Exception as e:
    print(f"Error loading models: {e}")

def preprocess_features(data: Dict[str, Any], is_batch: bool = False):
    if is_batch:
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame([data])
    
    # Map categorical features
    for col, mapping in mappings.items():
        if col in df.columns:
            df[col] = df[col].map(mapping)
    
    # Handle zeros in Cholesterol and RestingBP (as done in training)
    df['Cholesterol'] = df['Cholesterol'].replace(0, np.nan)
    df['RestingBP'] = df['RestingBP'].replace(0, np.nan)
    
    # --- Robust Outlier Handling (New) ---
    # We clip values to biological limits to prevent "impossible" values 
    # (like BP 10000) from breaking the model's logic.
    limits = {
        'Age': (1, 120),
        'RestingBP': (60, 250),
        'Cholesterol': (80, 600),
        'MaxHR': (50, 220),
        'Oldpeak': (-5, 10)
    }
    
    for col, (min_val, max_val) in limits.items():
        if col in df.columns:
            df[col] = df[col].clip(lower=min_val, upper=max_val)
    # -------------------------------------

    expected_cols = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol', 
                     'FastingBS', 'RestingECG', 'MaxHR', 'ExerciseAngina', 
                     'Oldpeak', 'ST_Slope']
    
    # Ensure all expected columns are present (important for CSV uploads)
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0 # Default value or handle accordingly
            
    df = df[expected_cols]
    
    # Impute missing values
    df_imputed = pd.DataFrame(imputer.transform(df), columns=expected_cols)
    
    return df_imputed

@app.get("/")
def read_root():
    return {"message": "Heart Disease Prediction API is running"}

@app.post("/predict")
async def predict_single(data: Dict[str, Any], model_name: str = "Random Forest"):
    if model_name not in models:
        raise HTTPException(status_code=400, detail="Invalid model name")
    
    try:
        df = preprocess_features(data)
        
        # Scaling for distance-based models
        if model_name in ["Logistic Regression", "SVM"]:
            X = scaler.transform(df)
        else:
            X = df.values
        
        model = models[model_name]
        prediction = int(model.predict(X)[0])
        probability = model.predict_proba(X)[0][1] if hasattr(model, "predict_proba") else None
        
        return {
            "model": model_name,
            "prediction": prediction,
            "probability": float(probability) if probability is not None else None,
            "risk": "High" if prediction == 1 else "Low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...), model_name: str = "Random Forest"):
    if model_name not in models:
        raise HTTPException(status_code=400, detail="Invalid model name")
    
    try:
        contents = await file.read()
        df_input = pd.read_csv(io.BytesIO(contents))
        
        df_processed = preprocess_features(df_input.to_dict(orient='list'), is_batch=True)
        
        if model_name in ["Logistic Regression", "SVM"]:
            X = scaler.transform(df_processed)
        else:
            X = df_processed.values
            
        model = models[model_name]
        predictions = model.predict(X).astype(int).tolist()
        probabilities = model.predict_proba(X)[:, 1].tolist() if hasattr(model, "predict_proba") else [None] * len(predictions)
        
        results = []
        for i in range(len(predictions)):
            prob = probabilities[i]
            results.append({
                "patient_index": i,
                "prediction": predictions[i],
                "probability": float(prob) if prob is not None else None,
                "risk": "High" if predictions[i] == 1 else "Low"
            })
            
        return {
            "model": model_name,
            "results": results,
            "total_patients": len(results),
            "high_risk_count": sum(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
