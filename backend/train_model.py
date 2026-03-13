import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import KNNImputer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Configuration
DATA_PATH = r"C:\Users\Admin\Downloads\heart.csv"
MODELS_DIR = "models"
import os
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

# Load data
df = pd.read_csv(DATA_PATH)

# Categorical mappings (Fixed for consistency)
mappings = {
    'Sex': {'M': 0, 'F': 1},
    'ChestPainType': {'ATA': 0, 'NAP': 1, 'ASY': 2, 'TA': 3},
    'RestingECG': {'Normal': 0, 'ST': 1, 'LVH': 2},
    'ExerciseAngina': {'N': 0, 'Y': 1},
    'ST_Slope': {'Up': 0, 'Flat': 1, 'Down': 2}
}

for col, mapping in mappings.items():
    df[col] = df[col].map(mapping)

# Features and Target
X = df.drop('HeartDisease', axis=1)
y = df['HeartDisease']

# Handle missing/zero values using KNN Imputer
X['Cholesterol'] = X['Cholesterol'].replace(0, np.nan)
X['RestingBP'] = X['RestingBP'].replace(0, np.nan)

imputer = KNNImputer(n_neighbors=3)
X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)

# Split
X_train, X_test, y_train, y_test = train_test_split(X_imputed, y, test_size=0.2, random_state=42, stratify=y)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Model 1: Logistic Regression
lr = LogisticRegression(solver='liblinear', max_iter=2000)
lr.fit(X_train_scaled, y_train)
lr_acc = accuracy_score(y_test, lr.predict(X_test_scaled))

# Model 2: SVM
svm = SVC(kernel='rbf', probability=True)
svm.fit(X_train_scaled, y_train)
svm_acc = accuracy_score(y_test, svm.predict(X_test_scaled))

# Model 3: Decision Tree
dt = DecisionTreeClassifier(max_depth=5, min_samples_split=2, class_weight='balanced', random_state=42)
dt.fit(X_train, y_train) # Tree-based models can handle unscaled data better
dt_acc = accuracy_score(y_test, dt.predict(X_test))

# Model 4: Random Forest
rf = RandomForestClassifier(n_estimators=300, max_depth=9, class_weight='balanced', random_state=42)
rf.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf.predict(X_test))

print(f"Logistic Regression Accuracy: {lr_acc:.4f}")
print(f"SVM Accuracy: {svm_acc:.4f}")
print(f"Decision Tree Accuracy: {dt_acc:.4f}")
print(f"Random Forest Accuracy: {rf_acc:.4f}")

# Save models and helpers
joblib.dump(lr, os.path.join(MODELS_DIR, 'logistic_regression.joblib'))
joblib.dump(svm, os.path.join(MODELS_DIR, 'svm.joblib'))
joblib.dump(dt, os.path.join(MODELS_DIR, 'decision_tree.joblib'))
joblib.dump(rf, os.path.join(MODELS_DIR, 'random_forest.joblib'))
joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.joblib'))
joblib.dump(imputer, os.path.join(MODELS_DIR, 'imputer.joblib'))
joblib.dump(mappings, os.path.join(MODELS_DIR, 'mappings.joblib'))

print("All models and preprocessing objects saved successfully.")
