# MINDORA 2.0 — STAGE 3B.3: MODEL CONFIGURATIONS & HYPERPARAMETER SPECIFICATIONS

**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Branch:** `mindora-2.0-rebuild`  
**Working Directory:** `D:\Depression calculator`  
**Document Type:** Preflight Model Specification & Configuration Contract  
**Preflight Date:** November 15, 2026  
**Auditor Role:** Senior ML Research Infrastructure Engineer & Model Architect  
**Stage Status:** PREFLIGHT ONLY — STRICTLY UNAUTHORIZED TO TRAIN  

---

## 1. Overview & Architectural Principles

Stage 3B.3 evaluates three distinct mathematical paradigms for tabular binary classification on the frozen Development partition ($N=23,716$):
1. **Model A (Linear Reference):** Logistic Regression with $L_2$ shrinkage and standardized linear decision boundary.
2. **Model B (Bagged Decision Trees):** Random Forest ensemble reducing variance through bootstrapped sample and feature subsampling.
3. **Model C (Boosted Decision Trees):** XGBoost ensemble iteratively fitting negative gradients of the binary cross-entropy loss.

### Governing Constraints
- **Zero Validation Data Leakage:** All data transformations (imputation, scaling, one-hot encoding) are encapsulated within a `scikit-learn` `Pipeline` and fitted **strictly on training fold indices**.
- **Identical Feature Space Representation:** All three models operate on the identical 10 survey features transformed into a unified numeric representation.
- **Fixed Ensemble Budget:** To ensure a fair comparison without confounding from outer-split early stopping leakage, tree ensembles use a fixed computational budget of $100$ trees.

---

## 2. Complete Model Configuration Specifications

### 2.1 Model A: Logistic Regression (Reference Baseline)

```python
Pipeline([
    ("preprocessor", ColumnTransformer([
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ]), FROZEN_NUMERICAL_FEATURES),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]), FROZEN_CATEGORICAL_FEATURES)
    ])),
    ("classifier", LogisticRegression(
        C=1.0,
        penalty="l2",
        solver="lbfgs",
        max_iter=1000,
        tol=1e-4,
        class_weight=None,
        random_state=42,
        fit_intercept=True
    ))
])
```

- **Objective / Loss:** Binary Cross-Entropy / Log-Loss with $L_2$ parameter penalty $\frac{1}{2C} \|\mathbf{w}\|_2^2$.
- **Convergence / Stopping:** L-BFGS two-loop optimization terminates when gradient infinity norm $< 10^{-4}$ or maximum 1,000 iterations reached.
- **Probability Output:** Sigmoid activation $\sigma(\mathbf{w}^T \mathbf{x} + b) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$.

---

### 2.2 Model B: Random Forest Classifier

```python
Pipeline([
    ("preprocessor", ColumnTransformer([
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())  # Preserved for feature space parity
        ]), FROZEN_NUMERICAL_FEATURES),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]), FROZEN_CATEGORICAL_FEATURES)
    ])),
    ("classifier", RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features="sqrt",
        bootstrap=True,
        random_state=42,
        n_jobs=-1,
        class_weight=None
    ))
])
```

- **Objective / Criterion:** Gini impurity minimization across orthogonal binary decision splits.
- **Ensemble Topology:** 100 decorrelated decision trees; sample bootstrap size = $N_{\text{train}}$ with replacement.
- **Regularization & Capacity Controls:**
  - `max_depth = 10`: Prevents unconstrained tree expansion from memorizing sparse tabular noise.
  - `min_samples_split = 5`: Requires at least 5 samples to consider an interior split.
  - `min_samples_leaf = 2`: Requires at least 2 samples per terminal leaf.
  - `max_features = "sqrt"`: Randomly selects $\approx \sqrt{p}$ features per split to enforce ensemble diversity.
- **Probability Output:** Unweighted average of leaf class empirical frequencies across all 100 trees:
  $$P(y=1 \mid \mathbf{x}) = \frac{1}{100} \sum_{t=1}^{100} \frac{N_{t,1}(\mathbf{x})}{N_t(\mathbf{x})}$$

---

### 2.3 Model C: XGBoost Classifier

```python
Pipeline([
    ("preprocessor", ColumnTransformer([
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())  # Preserved for feature space parity
        ]), FROZEN_NUMERICAL_FEATURES),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]), FROZEN_CATEGORICAL_FEATURES)
    ])),
    ("classifier", XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        gamma=0.0,
        reg_alpha=0.0,
        reg_lambda=1.0,
        objective="binary:logistic",
        eval_metric="logloss",
        tree_method="hist",
        random_state=42,
        n_jobs=-1
    ))
])
```

- **Objective Function:** Second-order Taylor approximation of binary log-loss:
  $$\mathcal{L}^{(t)} \approx \sum_{i=1}^n \left[ g_i f_t(\mathbf{x}_i) + \frac{1}{2} h_i f_t^2(\mathbf{x}_i) \right] + \Omega(f_t)$$
  where $g_i = \hat{p}_i - y_i$, $h_i = \hat{p}_i (1 - \hat{p}_i)$, and $\Omega(f_t) = \gamma T + \frac{1}{2} \lambda \sum w_j^2$.
- **Capacity & Shrinkage Controls:**
  - `n_estimators = 100`: Fixed boosting iterations.
  - `learning_rate = 0.08`: Conservative shrinkage parameter scaling tree contributions to prevent gradient overshoot.
  - `max_depth = 5`: Restricts maximum interaction order to 5-way feature conjuncts.
  - `subsample = 0.85`: Row subsampling without replacement per iteration for stochastic regularization.
  - `colsample_bytree = 0.85`: Column subsampling per tree for feature decorrelation.
  - `reg_lambda = 1.0`: Standard $L_2$ leaf weight regularization.
- **Probability Output:** Direct logistic sigmoid transform of accumulated leaf scores:
  $$P(y=1 \mid \mathbf{x}) = \sigma \left( \sum_{t=1}^{100} \eta f_t(\mathbf{x}) \right)$$

---

## 3. Systematic Hyperparameter Comparison Matrix

| Configuration Parameter | Logistic Regression (3B.2) | Random Forest (3B.3) | XGBoost (3B.3) | Rationale for Equivalence & Fairness |
|---|:---:|:---:|:---:|---|
| **Estimator Type** | Linear Classifier | Bagged Tree Ensemble | Gradient Boosted Trees | Evaluates linear, bagging, and boosting paradigms. |
| **Ensemble Size ($T$)** | 1 (Single Model) | 100 Trees | 100 Trees | Identical ensemble capacity budget for non-linear models. |
| **Max Tree Depth** | N/A | 10 | 5 | Scaled inversely with boosting iterations to control VC dimension. |
| **Subsampling Ratio** | 1.0 (Full Batch) | 1.0 (Bootstrap w/ Replacement) | 0.85 (Subsample w/o Replacement) | Standard canonical sampling protocols for bagging vs boosting. |
| **Column Subsampling** | 1.0 (All Features) | $\sqrt{p}$ per split | 0.85 per tree | Standard decorrelation mechanisms. |
| **Learning Rate ($\eta$)** | N/A (Direct Solve) | N/A (Equal Weights) | 0.08 | Conservative shrinkage preventing boosting overfit. |
| **Loss / Objective** | Binary Log-Loss | Gini Impurity | Binary Logistic Log-Loss | Standard optimization objectives. |
| **Class Weighting** | Unweighted (`None`) | Unweighted (`None`) | Unweighted (`scale_pos_weight=1.0`) | Preserves unweighted class ratio parity across all models. |
| **Random Seed** | 42 | 42 | 42 | Exact deterministic execution. |
| **Parallel Execution** | 1 thread | `n_jobs=-1` | `n_jobs=-1` | Full hardware utilization. |
| **Tree Algorithm** | N/A | Scikit-learn Cython Tree | `tree_method="hist"` | Exact histogram binning for high efficiency. |

---

## 4. Preprocessing Uniformity Guarantee

All three pipelines share the exact identical `preprocessor` definition:
1. **Numeric Features (6):** `Age`, `Academic Pressure`, `CGPA`, `Study Satisfaction`, `Work/Study Hours`, `Financial Stress`.
   - Imputer: `SimpleImputer(strategy="median")`
   - Scaler: `StandardScaler()`
   *(Note: While decision trees are invariant to monotonic feature scaling, retaining `StandardScaler` across all pipelines guarantees identical numerical precision and float representation across models).*
2. **Categorical Features (4):** `Gender`, `Sleep Duration`, `Dietary Habits`, `Degree`.
   - Imputer: `SimpleImputer(strategy="most_frequent")`
   - Encoder: `OneHotEncoder(handle_unknown="ignore", sparse_output=False)`

---

## 5. Verification & Preflight Safety Sign-Off

- **Code Validation:** Pipeline constructors and parameter dictionaries have been audited for scikit-learn 1.9.1 and xgboost 3.4.1 API compliance.
- **Preflight Boundary:** Zero model fitting or hyperparameter training was conducted in this stage.
- **Stage Status:** **PREFLIGHT SPECIFICATION COMPLETE — AWAITING EXPLICIT USER AUTHORIZATION BEFORE STAGE 3B.3 TRAINING.**
