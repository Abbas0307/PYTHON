# Mindora – Student Mental Wellness & Risk Insights

[![Python 3.12](https://img.shields.io/badge/Python-3.12-6D43C6.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.42+-8B5CF6.svg)](https://streamlit.io/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-6D43C6.svg)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-241A35.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-8B5CF6.svg)](https://shap.readthedocs.io/)

**Mindora** is a production-grade student mental wellness screening platform built with an ultra-premium white-and-violet SaaS aesthetic and an audited **tri-engine architecture** that preserves scientific rigor and clinical safety by maintaining strict boundaries between public machine learning models, digital lifestyle analytics, and standardized clinical psychometrics.

> ⚕️ **IMPORTANT CLINICAL & SAFETY DISCLAIMER**  
> Mindora is strictly an educational and voluntary screening platform. Outputs are **experimental screening indicators** and **do NOT constitute a medical diagnosis, clinical evaluation, or treatment plan**. If self-harm thoughts are indicated, Mindora initiates an immediate, deterministic crisis safety protocol independent of machine learning predictions.

---

## 🏛️ Tri-Engine Architecture

Mindora explicitly avoids the common failure mode of combining disparate questionnaire categories into a single fabricated depression percentage:

```
                            Mindora Tri-Engine Architecture
      ┌─────────────────────────────────┼─────────────────────────────────┐
      │                                 │                                 │
  [ENGINE 1]                        [ENGINE 2]                        [ENGINE 3]
Public ML Model             Digital & Social Lifestyle            Standardized PHQ-9
(10 Verified Features)      (Descriptive Habit Analysis)      (Clinical 9-Item Scale)
      │                                 │                                 │
• Calibrated XGBoost         • Phone & Social Screen Time      • Score (0-27) & Severity
• Stratified Val Selected    • Circadian Pre-Sleep Buffers     • Item 9 Self-Harm Flag
• Brier Score: 0.1448        • Social Comparison & Isolation   • Unconditional Crisis
• Local SHAP Attribution     • Actionable Lifestyle Guidance     Intervention (24/7)
```

1. **Engine 1 – Public Dataset Machine Learning**
   - Strictly trained on **10 compatible public dataset features** from 27,901 student records.
   - Completely excludes clinical crisis symptoms (`Have you ever had suicidal thoughts ?`) to eliminate target leakage.
   - Completely excludes unverified family health history (`Family History of Mental Illness`) to respect student privacy.
   - Selected strictly on validation metrics and calibrated using 5-fold cross-validation on training data (`CalibratedClassifierCV`, Brier score $= 0.1448$).
   - Provides local **SHAP TreeExplainer** feature attribution on lifestyle and study pressures.

2. **Engine 2 – Digital & Social Lifestyle Insights**
   - Analyses voluntary student responses regarding daily phone screen time, social media engagement, pre-sleep browsing, upward social comparison, notification habits, exercise frequency, daylight exposure, and peer connection.
   - Computes a Digital Friction index and Lifestyle Rhythm balance.
   - Generates tailored, evidence-informed educational wellness suggestions.
   - **Never conflated with or presented as an ML depression probability.**

3. **Engine 3 – Validated Patient Health Questionnaire (PHQ-9)**
   - Implements all 9 standardized clinical items evaluated on the standard 0–3 Likert scale (0 to 27 total).
   - Classifies severity into validated clinical tiers (Minimal, Mild, Moderate, Moderately Severe, Severe).
   - **Completely segregated from Engine 1:** No PHQ-9 responses are fed into the ML model.
   - **Deterministic Crisis Safeguard:** If Item 9 is flagged ($>0$), an immediate crisis intervention alert displays 24/7 emergency toll-free helplines before all other results.

---

## 📊 Model Benchmark & Historical Progression

Trained and evaluated on **27,901 records** from the Hugging Face [Student Depression Dataset](https://huggingface.co/datasets/urmah/student-depression-analysis) using a stratified 70% Train ($N=19,530$), 15% Validation ($N=4,185$), and 15% Test ($N=4,186$) split:

### Preliminary Experiments (Audited & Discarded)
- *Preliminary Exp 1 (84.11% Acc):* Included `Have you ever had suicidal thoughts ?`. Audited finding: Gini importance exceeded 59.9%. Identified as clinical target leakage and discarded.
- *Preliminary Exp 2 (80.12% Acc):* Included `Family History of Mental Illness`. Discarded to respect student privacy.

### Production Pipeline Benchmark (Strictly 10 Clean Features)

| Model | Val F1 | Val ROC-AUC | Test Acc | Test Recall | Test F1 | Test ROC-AUC | Test Brier |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Selected Base)** | **0.8309** | **0.8722** | **79.57%** | **84.37%** | **0.8287** | **0.8672** | **0.1441** |
| Random Forest | 0.8208 | 0.8697 | 78.55% | 79.48% | 0.8127 | 0.8627 | 0.1562 |
| Logistic Regression | 0.8171 | 0.8712 | 78.95% | 79.23% | 0.8151 | 0.8664 | 0.1475 |
| **Final Calibrated XGBoost** | — | — | **79.69%** | **84.58%** | **0.8299** | **0.8676** | **0.1448** |

*Model selection was conducted strictly using validation metrics without test set access. Probability calibration was fitted with 5-fold cross-validation on training data.*

---

## 📁 Project Structure

```
Student-Depression-Predictor/
├── dataset/
│   └── Student_Depression_Dataset.csv   # Hugging Face benchmark dataset (27,901 rows)
├── models/
│   ├── best_model.pkl                   # Fitted Pipeline (Preprocessor + Calibrated XGBoost)
│   ├── model_comparison.json            # Empirical metrics across train, val, and test splits
│   └── feature_importance.csv           # Clean feature importance table
├── evaluation/
│   ├── confusion_matrix.png             # Held-out test set confusion matrix plots
│   ├── model_comparison.png             # Comparative metrics, ROC curves & reliability diagram
│   └── training_report.txt              # Detailed textual audit & evaluation report
├── screenshots/
│   ├── confusion_matrix.png             # Confusion matrix visualization
│   └── model_comparison_and_calibration.png # ROC & Reliability curves
├── src/
│   ├── data_loader.py                   # Ingestion, integrity checks & leakage analysis
│   ├── preprocessing.py                 # ColumnTransformer on 10 non-leaking features
│   ├── train.py                         # Validation-based selection & CalibratedClassifierCV
│   ├── evaluate.py                      # Metrics, confusion matrix, ROC & reliability curves
│   ├── predict.py                       # Engine 1 inference, calibrated tiers & SHAP
│   ├── recommendations.py               # Engine 2 (Lifestyle) & Engine 3 (PHQ-9 + Crisis)
│   └── ui_theme.py                      # White & violet CSS theme, 3D visual effects & voice
├── app.py                               # Multi-page Streamlit application
├── requirements.txt                     # Pinned project dependencies
├── README.md                            # Complete architectural & technical documentation
└── .gitignore                           # Git exclusions
```

---

## 🚀 Setup & Execution

### 1. Prerequisites
- Python 3.12 (Recommended) or 3.11

### 2. Installation
```bash
# Clone the repository
cd "Depression calculator"

# Create a virtual environment
py -3.12 -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Training & Validation Workflow
To re-run the complete training, validation-based selection, probability calibration, and artifact generation:
```bash
python -m src.train
```

### 4. Running the Web Application
```bash
streamlit run app.py
# Or via python directly:
python -m streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 🔬 Dataset Source & Limitations

1. **Public Dataset Source:**  
   The underlying baseline dataset is the **Student Depression Dataset** published on [Hugging Face](https://huggingface.co/datasets/urmah/student-depression-analysis) (27,901 student survey rows collected in India across diverse undergraduate and postgraduate programs).
2. **Self-Reported Nature:**  
   The target `Depression` label in this dataset is based on self-reported survey responses rather than structured clinical diagnostic interviews (such as SCID-5). Mindora strictly communicates outputs as *screening indicators*.
3. **Cross-Sectional Limitation:**  
   Cross-sectional survey data captures correlations at a single point in time and cannot determine temporal precedence or biological causation.
4. **Generalizability:**  
   Because the dataset is predominantly Indian college students, cross-population generalizations should be treated with appropriate clinical and cultural caution.

---

## 🔮 Future Custom Dataset Collection Plan

While the current Mindora release operates strictly with **zero data retention** (all computation is held in ephemeral session memory and destroyed upon tab closure), future academic extensions will involve:

1. **Institutional Review Board (IRB) / Ethics Approval:**  
   Formal ethical protocol approval before initiating voluntary longitudinal data storage.
2. **Opt-In Anonymized Research Database:**  
   Students may voluntarily opt in to contribute anonymized digital habits and academic stress data via cryptographically hashed tokens.
3. **Multi-Institution Benchmarking:**  
   Collaborating with university counseling centers across North America, Europe, and Asia to validate model performance across broader demographics.
4. **Longitudinal Trajectory Modeling:**  
   Transitioning from static cross-sectional snapshots to time-series recurrent models evaluating mid-term and final-exam stress spikes.

---

## 🔒 Ethics, Privacy & Responsible AI

- **Zero Data Persistence:** Mindora does not collect student names, email addresses, or student IDs. Assessment responses are held strictly in temporary browser session memory and are destroyed upon tab closure.
- **Client-Side Speech:** Voice input runs entirely in the user's browser via the standard Web Speech API without audio recording or transmission.
- **Explainability:** Local SHAP explanations explain statistical associations with historical student data and never claim medical causation.
- **Separation of Concerns:** PHQ-9 psychometric evaluation is completely separate from ML predictions.
- **Immediate Crisis Safeguard:** Self-harm thoughts (PHQ-9 Item 9) trigger an immediate emergency support screen with verified 24/7 helplines (US 988, India 14416 / KIRAN, UK 111 / 116 123, Australia 13 11 14).
