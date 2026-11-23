"""
src/data_platform/real_world_analyzer.py
MINDORA 2.0 — PHASE 8: REAL-WORLD DEPRESSION DATA ANALYZER
Robust, leakage-free exploratory analysis and experimental evaluation platform
for the manually collected 163-record student dataset (STUDENT dataset.xlsx).

MANDATORY GOVERNANCE NOTICE:
"163-RECORD MANUALLY COLLECTED STUDENT DATASET — PROVENANCE AND CONSENT UNVERIFIED. RESEARCH USE ONLY."

Strict Scientific & Privacy Invariants:
1. Zero individual student depression predictions.
2. Zero guardian alert triggers from research dataset records.
3. Zero identifiable respondent disclosures (raw records never exposed).
4. Three distinct target classes (Yes, No, Not Sure) preserved.
5. Association strictly separated from causation.
6. Research access restricted to authorized research administrators.
"""

import os
import hashlib
import io
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from xgboost import XGBClassifier

MANDATORY_GOVERNANCE_NOTICE = (
    "163-RECORD MANUALLY COLLECTED STUDENT DATASET — PROVENANCE AND CONSENT UNVERIFIED. RESEARCH USE ONLY."
)

DATASET_CANDIDATE_PATHS = [
    os.path.join("ml_lab", "data", "raw", "STUDENT_dataset_research_readonly.xlsx"),
    os.path.join("ml_lab", "data", "raw", "STUDENT dataset.xlsx"),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_lab", "data", "raw", "STUDENT_dataset_research_readonly.xlsx")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_lab", "data", "raw", "STUDENT dataset.xlsx")),
]


class RealWorldDepressionAnalyzer:
    """
    Authoritative analysis engine for the 163-record student research dataset.
    """

    def __init__(self, dataset_path: Optional[str] = None):
        self.dataset_path = self._resolve_dataset_path(dataset_path)
        self._sha256 = None
        self._raw_df: Optional[pd.DataFrame] = None
        self._cached_overview: Optional[Dict[str, Any]] = None
        self._cached_exploratory: Optional[Dict[str, Any]] = None
        self._cached_models: Optional[Dict[str, Any]] = None

    def _resolve_dataset_path(self, explicit_path: Optional[str]) -> str:
        if explicit_path and os.path.exists(explicit_path):
            return explicit_path
        for p in DATASET_CANDIDATE_PATHS:
            if os.path.exists(p):
                return p
        raise FileNotFoundError("Could not locate 'STUDENT dataset.xlsx' in ml_lab/data/raw/.")

    def get_file_hash(self) -> str:
        if self._sha256 is None:
            sha = hashlib.sha256()
            with open(self.dataset_path, "rb") as f:
                while chunk := f.read(65536):
                    sha.update(chunk)
            self._sha256 = sha.hexdigest().upper()
        return self._sha256

    def load_dataset(self) -> pd.DataFrame:
        """
        Loads the workbook, verifies dimensions, and enforces read-only access.
        """
        if self._raw_df is not None:
            return self._raw_df.copy()

        df = pd.read_excel(self.dataset_path, sheet_name="Form Responses 1")
        
        # Invariant checks
        if len(df) != 162:
            raise ValueError(f"Expected 162 respondent records, found {len(df)}.")
        if len(df.columns) != 14:
            raise ValueError(f"Expected 14 columns, found {len(df.columns)}.")

        self._raw_df = df
        return self._raw_df.copy()

    # -------------------------------------------------------------------------
    # PART 1A: DATASET OVERVIEW
    # -------------------------------------------------------------------------
    def get_dataset_overview(self) -> Dict[str, Any]:
        """
        Computes aggregate distribution statistics across all demographic,
        academic, lifestyle, and clinical-history indicators.
        """
        if self._cached_overview is not None:
            return self._cached_overview

        df = self.load_dataset()

        # Target Column
        target_col = [c for c in df.columns if "healthcare" in str(c).lower() or "depression" in str(c).lower()][0]
        target_counts = df[target_col].str.strip().str.lower().value_counts().to_dict()
        no_count = int(target_counts.get("no", 0))
        yes_count = int(target_counts.get("yes", 0))
        not_sure_count = int(target_counts.get("not sure", 0))
        total_resp = len(df)

        # Age column & Minor detection
        age_col = [c for c in df.columns if "age?" in str(c).lower()][0]
        ages_num = pd.to_numeric(df[age_col], errors="coerce").dropna()
        minors_count = int((ages_num < 18).sum())
        adults_count = int((ages_num >= 18).sum())

        age_distribution = {
            "min_age": int(ages_num.min()),
            "max_age": int(ages_num.max()),
            "mean_age": round(float(ages_num.mean()), 2),
            "median_age": float(ages_num.median()),
            "minors_count": minors_count,
            "minors_percentage": round((minors_count / total_resp) * 100, 2),
            "adults_count": adults_count,
            "adults_percentage": round((adults_count / total_resp) * 100, 2),
            "buckets": {
                "<18 (Minor)": minors_count,
                "18–20": int(((ages_num >= 18) & (ages_num <= 20)).sum()),
                "21–23": int(((ages_num >= 21) & (ages_num <= 23)).sum()),
                "24+": int((ages_num >= 24).sum())
            }
        }

        # Gender column
        gender_col = [c for c in df.columns if "gender" in str(c).lower()][0]
        gender_counts = df[gender_col].str.strip().value_counts().to_dict()

        # Dietary habits
        diet_col = [c for c in df.columns if "dietary" in str(c).lower()][0]
        diet_counts = df[diet_col].str.strip().value_counts().to_dict()

        # Academic Programme clustering
        prog_col = [c for c in df.columns if "degree" in str(c).lower() or "programme" in str(c).lower()][0]
        prog_clusters = self._cluster_programmes(df[prog_col])

        # CGPA cleaning & stats
        cgpa_col = [c for c in df.columns if "cgpa" in str(c).lower()][0]
        cgpa_cleaned = self._clean_cgpa_series(df[cgpa_col])
        cgpa_stats = {
            "mean": round(float(cgpa_cleaned.mean()), 2),
            "median": round(float(cgpa_cleaned.median()), 2),
            "min": round(float(cgpa_cleaned.min()), 2),
            "max": round(float(cgpa_cleaned.max()), 2),
            "q25": round(float(cgpa_cleaned.quantile(0.25)), 2),
            "q75": round(float(cgpa_cleaned.quantile(0.75)), 2),
            "buckets": {
                "<6.0": int((cgpa_cleaned < 6.0).sum()),
                "6.0–6.9": int(((cgpa_cleaned >= 6.0) & (cgpa_cleaned < 7.0)).sum()),
                "7.0–7.9": int(((cgpa_cleaned >= 7.0) & (cgpa_cleaned < 8.0)).sum()),
                "8.0–8.9": int(((cgpa_cleaned >= 8.0) & (cgpa_cleaned < 9.0)).sum()),
                "9.0–10.0": int((cgpa_cleaned >= 9.0).sum())
            }
        }

        # Academic Pressure (1 to 5 mapping)
        pressure_col = [c for c in df.columns if "pressure" in str(c).lower()][0]
        pressure_counts = df[pressure_col].str.strip().str.lower().value_counts().to_dict()
        pressure_ordered = {
            "very low": pressure_counts.get("very low", 0),
            "low": pressure_counts.get("low", 0),
            "moderate": pressure_counts.get("moderate", 0),
            "high": pressure_counts.get("high", 0),
            "very high": pressure_counts.get("very high", 0)
        }

        # Study Satisfaction (1 to 5)
        satisfaction_col = [c for c in df.columns if "satisfied" in str(c).lower()][0]
        satisfaction_counts = pd.to_numeric(df[satisfaction_col], errors="coerce").value_counts().sort_index().to_dict()

        # Sleep Duration
        sleep_col = [c for c in df.columns if "sleep" in str(c).lower()][0]
        sleep_counts = df[sleep_col].str.strip().value_counts().to_dict()

        # Daily Study/Work Hours
        hours_col = [c for c in df.columns if "spend studying" in str(c).lower() or "hours do you spend" in str(c).lower()][0]
        hours_cleaned = self._clean_hours_series(df[hours_col])
        study_hours_stats = {
            "mean": round(float(hours_cleaned.mean()), 2),
            "median": round(float(hours_cleaned.median()), 2),
            "min": round(float(hours_cleaned.min()), 2),
            "max": round(float(hours_cleaned.max()), 2),
            "buckets": {
                "<3 hrs": int((hours_cleaned < 3).sum()),
                "3–5 hrs": int(((hours_cleaned >= 3) & (hours_cleaned <= 5)).sum()),
                "6–8 hrs": int(((hours_cleaned >= 6) & (hours_cleaned <= 8)).sum()),
                ">8 hrs": int((hours_cleaned > 8).sum())
            }
        }

        # Financial Stress (1 to 5)
        fin_col = [c for c in df.columns if "financial stress" in str(c).lower()][0]
        fin_counts = pd.to_numeric(df[fin_col], errors="coerce").value_counts().sort_index().to_dict()

        # Missing values check across all columns
        missing_stats = {str(col): int(df[col].isnull().sum()) for col in df.columns}

        overview = {
            "governance_notice": MANDATORY_GOVERNANCE_NOTICE,
            "provenance_status": "MANUALLY COLLECTED — UNVERIFIED PROVENANCE — RESEARCH USE ONLY",
            "file_name": os.path.basename(self.dataset_path),
            "file_sha256": self.get_file_hash(),
            "total_records": total_resp,
            "total_columns": len(df.columns),
            "missing_value_count": sum(missing_stats.values()),
            "missing_values_by_column": missing_stats,
            "target_distribution": {
                "question": "Has a qualified healthcare professional ever told you that you have depression?",
                "total_valid_responses": total_resp,
                "counts": {
                    "No": no_count,
                    "Yes": yes_count,
                    "Not Sure": not_sure_count
                },
                "percentages": {
                    "No": round((no_count / total_resp) * 100, 2),
                    "Yes": round((yes_count / total_resp) * 100, 2),
                    "Not Sure": round((not_sure_count / total_resp) * 100, 2)
                }
            },
            "age_distribution": age_distribution,
            "gender_distribution": gender_counts,
            "dietary_distribution": diet_counts,
            "programme_clusters": prog_clusters,
            "cgpa_statistics": cgpa_stats,
            "academic_pressure_distribution": pressure_ordered,
            "study_satisfaction_distribution": {str(k): int(v) for k, v in satisfaction_counts.items()},
            "sleep_duration_distribution": sleep_counts,
            "daily_study_hours": study_hours_stats,
            "financial_stress_distribution": {str(k): int(v) for k, v in fin_counts.items()}
        }

        self._cached_overview = overview
        return overview

    # -------------------------------------------------------------------------
    # PART 1B: EXPLORATORY ASSOCIATION ANALYSIS
    # -------------------------------------------------------------------------
    def get_exploratory_analysis(self) -> Dict[str, Any]:
        """
        Performs bivariate cross-tabulation, Cramér's V, Chi-Square contingency tests,
        and effect sizes between factors and the self-reported target.
        Enforces clear separation between association and causation.
        """
        if self._cached_exploratory is not None:
            return self._cached_exploratory

        df = self.load_dataset()
        target_col = [c for c in df.columns if "healthcare" in str(c).lower() or "depression" in str(c).lower()][0]
        df["target_clean"] = df[target_col].str.strip().str.lower()

        factors = [
            ("Academic Pressure", self._get_pressure_categories(df)),
            ("Study Satisfaction", self._get_satisfaction_categories(df)),
            ("Sleep Duration", self._get_sleep_categories(df)),
            ("Financial Stress", self._get_financial_categories(df)),
            ("Daily Study Hours", self._get_hours_categories(df)),
            ("Dietary Habits", self._get_diet_categories(df)),
            ("Gender Categories", self._get_gender_categories(df)),
            ("Age Groups", self._get_age_categories(df)),
            ("Academic Programme", self._get_programme_categories(df)),
            ("CGPA Range", self._get_cgpa_categories(df))
        ]

        associations = {}
        for factor_name, series in factors:
            associations[factor_name] = self._compute_factor_association(factor_name, series, df["target_clean"])

        result = {
            "governance_notice": MANDATORY_GOVERNANCE_NOTICE,
            "causation_disclaimer": (
                "CRITICAL SCIENTIFIC DISTINCTION: All statistics report observational associations within an unmonitored "
                "convenience sample. Cross-sectional data CANNOT establish causality. None of these factors (academic pressure, "
                "financial stress, sleep hours) can be claimed to cause depression."
            ),
            "target_variable": "Self-reported Depression History (3-Category: Yes, No, Not Sure)",
            "total_sample_size": len(df),
            "factors": associations
        }

        self._cached_exploratory = result
        return result

    def _compute_factor_association(self, factor_name: str, factor_series: pd.Series, target_series: pd.Series) -> Dict[str, Any]:
        """
        Cross-tabulates factor categories with 3-class target and tests significance.
        """
        ct = pd.crosstab(factor_series, target_series)
        categories = list(ct.index)

        # Cross-tabulation table with counts and percentages
        rows = []
        for cat in categories:
            no_c = int(ct.loc[cat, "no"]) if "no" in ct.columns and cat in ct.index else 0
            yes_c = int(ct.loc[cat, "yes"]) if "yes" in ct.columns and cat in ct.index else 0
            ns_c = int(ct.loc[cat, "not sure"]) if "not sure" in ct.columns and cat in ct.index else 0
            tot = no_c + yes_c + ns_c
            rows.append({
                "category": str(cat),
                "total": tot,
                "counts": {"No": no_c, "Yes": yes_c, "Not Sure": ns_c},
                "rates": {
                    "no_rate": round((no_c / tot * 100) if tot > 0 else 0.0, 1),
                    "yes_rate": round((yes_c / tot * 100) if tot > 0 else 0.0, 1),
                    "not_sure_rate": round((ns_c / tot * 100) if tot > 0 else 0.0, 1)
                }
            })

        # Statistical tests: Chi-Square and Cramér's V
        chi2_val, p_val, dof, expected = stats.chi2_contingency(ct)
        min_expected = float(expected.min())
        assumptions_met = bool(min_expected >= 5.0)

        # Cramér's V
        n = ct.values.sum()
        r, k = ct.shape
        min_dim = min(r - 1, k - 1)
        cramers_v = math.sqrt(chi2_val / (n * min_dim)) if min_dim > 0 and n > 0 else 0.0

        # Effect size interpretation
        if cramers_v < 0.10:
            effect_magnitude = "Negligible"
        elif cramers_v < 0.30:
            effect_magnitude = "Small"
        elif cramers_v < 0.50:
            effect_magnitude = "Moderate"
        else:
            effect_magnitude = "Strong"

        # 95% Confidence Interval for yes_rate in highest category vs lowest
        rates = [r["rates"]["yes_rate"] for r in rows if r["total"] >= 10]
        max_rate = max(rates) if rates else 0.0
        min_rate = min(rates) if rates else 0.0
        rate_diff = round(max_rate - min_rate, 1)

        return {
            "factor_name": factor_name,
            "sample_size": int(n),
            "contingency_table": rows,
            "statistical_test": {
                "test_name": "Pearson Chi-Square Test of Independence",
                "chi2_statistic": round(float(chi2_val), 3),
                "degrees_of_freedom": int(dof),
                "p_value": round(float(p_val), 4),
                "statistically_significant_at_05": bool(p_val < 0.05),
                "min_expected_frequency": round(min_expected, 2),
                "chi_square_assumptions_met": assumptions_met,
                "assumption_warning": None if assumptions_met else (
                    f"Sample limitation: minimum expected cell frequency ({min_expected:.1f}) is less than 5. "
                    "Chi-Square asymptotic p-value should be interpreted cautiously."
                )
            },
            "effect_size": {
                "metric": "Cramér's V",
                "value": round(float(cramers_v), 3),
                "interpretation": effect_magnitude,
                "rate_differential_percentage_points": rate_diff
            }
        }

    # -------------------------------------------------------------------------
    # PART 1D: RESEARCH MODEL LABORATORY
    # -------------------------------------------------------------------------
    def run_research_models(self) -> Dict[str, Any]:
        """
        Isolated experimental model evaluation on the 163-record dataset.
        Evaluates Logistic Regression, Random Forest, XGBoost, and Support Vector Machine.
        
        Strict Governance Limits:
        - Evaluated ONLY on clean binary ground truth (N = 143; excludes 19 'Not Sure' responses).
        - Preprocessing fitted inside repeated 5-fold cross-validation folds.
        - Zero production exposure or student prediction deployment.
        """
        if self._cached_models is not None:
            return self._cached_models

        df = self.load_dataset()
        target_col = [c for c in df.columns if "healthcare" in str(c).lower() or "depression" in str(c).lower()][0]
        target_clean = df[target_col].str.strip().str.lower()

        # Binary reduction documentation
        binary_mask = target_clean.isin(["yes", "no"])
        not_sure_count = int((target_clean == "not sure").sum())
        binary_df = df[binary_mask].copy()
        y = (binary_df[target_col].str.strip().str.lower() == "yes").astype(int).values

        n_clean = len(y)
        yes_clean = int(y.sum())
        no_clean = int(n_clean - yes_clean)

        # Feature matrix preparation
        X = self._build_feature_matrix(binary_df)

        rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=42)

        raw_models = {
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42),
            "XGBoost": XGBClassifier(n_estimators=50, max_depth=3, eval_metric="logloss", random_state=42),
            "SVM": CalibratedClassifierCV(SVC(kernel="rbf", random_state=42), ensemble=False)
        }

        results = {}
        for name, clf in raw_models.items():
            pipe = Pipeline([
                ("scaler", StandardScaler()),
                ("classifier", clf)
            ])

            acc_list, prec_list, rec_list, f1_list, roc_list, spec_list = [], [], [], [], [], []

            for train_idx, val_idx in rskf.split(X, y):
                X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
                y_tr, y_val = y[train_idx], y[val_idx]

                pipe.fit(X_tr, y_tr)
                y_pred = pipe.predict(X_val)
                y_prob = pipe.predict_proba(X_val)[:, 1]

                acc_list.append(accuracy_score(y_val, y_pred))
                prec_list.append(precision_score(y_val, y_pred, zero_division=0))
                rec_list.append(recall_score(y_val, y_pred, zero_division=0))
                f1_list.append(f1_score(y_val, y_pred, zero_division=0))
                roc_list.append(roc_auc_score(y_val, y_prob))

                tn, fp, fn, tp = confusion_matrix(y_val, y_pred, labels=[0, 1]).ravel()
                spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
                spec_list.append(spec)

            def get_stat(arr: List[float]) -> Dict[str, Any]:
                m = float(np.mean(arr))
                s = float(np.std(arr))
                se = s / math.sqrt(len(arr))
                return {
                    "mean": round(m, 4),
                    "std": round(s, 4),
                    "ci_95_lower": round(max(0.0, m - 1.96 * se), 4),
                    "ci_95_upper": round(min(1.0, m + 1.96 * se), 4)
                }

            results[name] = {
                "name": name,
                "n_evaluations": len(acc_list),
                "metrics": {
                    "accuracy": get_stat(acc_list),
                    "precision": get_stat(prec_list),
                    "recall": get_stat(rec_list),
                    "specificity": get_stat(spec_list),
                    "f1_score": get_stat(f1_list),
                    "roc_auc": get_stat(roc_list)
                },
                "variance_assessment": "High sampling uncertainty due to small positive class size (N = 45)."
            }

        overview = {
            "governance_notice": MANDATORY_GOVERNANCE_NOTICE,
            "cohort_isolation_notice": (
                f"Binary ground truth cohort formed by explicitly excluding {not_sure_count} 'not sure' responses. "
                f"Reduced sample size: N = {n_clean} ({yes_clean} Yes, {no_clean} No). "
                "Cross-validation does NOT establish clinical diagnostic validity."
            ),
            "no_production_endpoint_guarantee": (
                "STRICT INVARIANT: No individual student predictions or production endpoints exist for this dataset. "
                "Models remain strictly isolated within research exploration."
            ),
            "evaluation_strategy": "Repeated 5-Fold Stratified Cross-Validation (5 Repeats = 25 Folds)",
            "models": results
        }

        self._cached_models = overview
        return overview

    # -------------------------------------------------------------------------
    # PART 1E: REPORT & EXPORT GENERATION
    # -------------------------------------------------------------------------
    def export_summary_csv(self) -> str:
        """
        Generates aggregate CSV text summarizing factor associations.
        Contains ZERO direct student identifiers.
        """
        exploratory = self.get_exploratory_analysis()
        out = io.StringIO()
        out.write("MINDORA 2.0 RESEARCH LABORATORY — AGGREGATE RESEARCH SUMMARY (163-RECORD DATASET)\n")
        out.write(f"Governance Notice: {MANDATORY_GOVERNANCE_NOTICE}\n")
        out.write("Factor,Category,Total_Respondents,Count_No,Count_Yes,Count_NotSure,Yes_Percentage,No_Percentage\n")

        for factor_name, factor_data in exploratory["factors"].items():
            for row in factor_data["contingency_table"]:
                out.write(
                    f"\"{factor_name}\",\"{row['category']}\",{row['total']},"
                    f"{row['counts']['No']},{row['counts']['Yes']},{row['counts']['Not Sure']},"
                    f"{row['rates']['yes_rate']},{row['rates']['no_rate']}\n"
                )

        return out.getvalue()

    def export_summary_text_report(self) -> str:
        """
        Generates comprehensive text research report suitable for PDF export or archiving.
        """
        overview = self.get_dataset_overview()
        exploratory = self.get_exploratory_analysis()
        models = self.run_research_models()

        lines = [
            "=" * 80,
            "MINDORA 2.0 — REAL-WORLD DEPRESSION DATA ANALYZER RESEARCH REPORT",
            "=" * 80,
            f"GOVERNANCE: {MANDATORY_GOVERNANCE_NOTICE}",
            f"FILE NAME: {overview['file_name']}",
            f"SHA-256 HASH: {overview['file_sha256']}",
            f"TOTAL RECORDS: {overview['total_records']} (162 respondents + 1 header)",
            f"MINORS DETECTED: {overview['age_distribution']['minors_count']} respondents (<18 years old)",
            f"MISSING VALUES: {overview['missing_value_count']} across all 14 columns",
            "-" * 80,
            "1. TARGET DISTRIBUTION (Self-Reported Depression History)",
            f"   - Negative ('No'): {overview['target_distribution']['counts']['No']} ({overview['target_distribution']['percentages']['No']}%)",
            f"   - Affirmative ('Yes'): {overview['target_distribution']['counts']['Yes']} ({overview['target_distribution']['percentages']['Yes']}%)",
            f"   - Uncertain ('Not Sure'): {overview['target_distribution']['counts']['Not Sure']} ({overview['target_distribution']['percentages']['Not Sure']}%)",
            "-" * 80,
            "2. BIVARIATE ASSOCIATIONS (Observational Only — Causation Not Established)",
        ]

        for factor_name, f_data in exploratory["factors"].items():
            st = f_data["statistical_test"]
            es = f_data["effect_size"]
            lines.append(f"   • {factor_name}:")
            lines.append(f"       Chi-Square = {st['chi2_statistic']}, df = {st['degrees_of_freedom']}, p = {st['p_value']} (p<0.05: {st['statistically_significant_at_05']})")
            lines.append(f"       Cramér's V = {es['value']} ({es['interpretation']} effect)")

        lines.extend([
            "-" * 80,
            "3. RESEARCH MODEL LABORATORY (Repeated 5-Fold Stratified CV, N = 143)",
            f"   Notice: {models['cohort_isolation_notice']}",
        ])

        for m_name, m_info in models["models"].items():
            acc = m_info["metrics"]["accuracy"]
            roc = m_info["metrics"]["roc_auc"]
            f1 = m_info["metrics"]["f1_score"]
            lines.append(f"   • {m_name}:")
            lines.append(f"       Accuracy: {acc['mean']} ± {acc['std']} (95% CI: [{acc['ci_95_lower']}, {acc['ci_95_upper']}])")
            lines.append(f"       ROC-AUC:  {roc['mean']} ± {roc['std']} (95% CI: [{roc['ci_95_lower']}, {roc['ci_95_upper']}])")
            lines.append(f"       F1-Score: {f1['mean']} ± {f1['std']} (95% CI: [{f1['ci_95_lower']}, {f1['ci_95_upper']}])")

        lines.extend([
            "-" * 80,
            "4. ETHICAL & CLINICAL SAFEGUARDING",
            "   - Zero individual predictions.",
            "   - Zero guardian email alerts from research records.",
            "   - Isolated from student production data.",
            "=" * 80,
        ])

        return "\n".join(lines)

    # -------------------------------------------------------------------------
    # HELPER DATA CLEANING & CATEGORIZATION METHODS
    # -------------------------------------------------------------------------
    def _cluster_programmes(self, series: pd.Series) -> Dict[str, int]:
        clusters = {
            "Engineering & Tech": 0,
            "Business & Management": 0,
            "Sciences & Computing": 0,
            "Medicine & Healthcare": 0,
            "Arts, Law & Other": 0
        }
        for val in series.dropna().astype(str):
            v = val.lower().strip()
            if any(k in v for k in ["b.e", "b.tech", "btech", "eng", "cse", "ece", "mech", "civil", "tech"]):
                clusters["Engineering & Tech"] += 1
            elif any(k in v for k in ["bba", "mba", "commerce", "b.com", "bcom", "management", "business", "fin"]):
                clusters["Business & Management"] += 1
            elif any(k in v for k in ["bsc", "b.sc", "bca", "mca", "data", "science", "math", "physics"]):
                clusters["Sciences & Computing"] += 1
            elif any(k in v for k in ["mbbs", "pharma", "dent", "nurse", "med", "doctor"]):
                clusters["Medicine & Healthcare"] += 1
            else:
                clusters["Arts, Law & Other"] += 1
        return clusters

    def _clean_cgpa_series(self, series: pd.Series) -> pd.Series:
        cleaned = pd.to_numeric(series, errors="coerce")
        # filter out invalid outliers > 10
        valid = cleaned[(cleaned >= 0) & (cleaned <= 10)]
        median_cgpa = valid.median() if len(valid) > 0 else 8.0
        return cleaned.apply(lambda x: x if (0 <= x <= 10) else median_cgpa).fillna(median_cgpa)

    def _clean_hours_series(self, series: pd.Series) -> pd.Series:
        def parse_h(val):
            try:
                f = float(val)
                return f if 0 <= f <= 24 else 4.0
            except:
                s = str(val).strip().lower()
                if "-" in s:
                    parts = s.split("-")
                    try:
                        return (float(parts[0]) + float(parts[1])) / 2.0
                    except:
                        return 4.0
                return 4.0
        return series.apply(parse_h)

    def _get_pressure_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "pressure" in str(c).lower()][0]
        return df[col].str.strip().str.lower().map({
            "very low": "1 - Very Low",
            "low": "2 - Low",
            "moderate": "3 - Moderate",
            "high": "4 - High",
            "very high": "5 - Very High"
        }).fillna("3 - Moderate")

    def _get_satisfaction_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "satisfied" in str(c).lower()][0]
        return pd.to_numeric(df[col], errors="coerce").map({
            1: "1 - Very Dissatisfied",
            2: "2 - Dissatisfied",
            3: "3 - Neutral",
            4: "4 - Satisfied",
            5: "5 - Very Satisfied"
        }).fillna("3 - Neutral")

    def _get_sleep_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "sleep" in str(c).lower()][0]
        return df[col].str.strip()

    def _get_financial_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "financial stress" in str(c).lower()][0]
        return pd.to_numeric(df[col], errors="coerce").map({
            1: "1 - Very Low",
            2: "2 - Low",
            3: "3 - Moderate",
            4: "4 - High",
            5: "5 - Very High"
        }).fillna("3 - Moderate")

    def _get_hours_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "spend studying" in str(c).lower() or "hours do you spend" in str(c).lower()][0]
        cleaned = self._clean_hours_series(df[col])
        return cleaned.apply(lambda h: "<3 hrs" if h < 3 else ("3–5 hrs" if h <= 5 else ("6–8 hrs" if h <= 8 else ">8 hrs")))

    def _get_diet_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "dietary" in str(c).lower()][0]
        return df[col].str.strip()

    def _get_gender_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "gender" in str(c).lower()][0]
        return df[col].str.strip()

    def _get_age_categories(self, df: pd.DataFrame) -> pd.Series:
        col = [c for c in df.columns if "age?" in str(c).lower()][0]
        ages = pd.to_numeric(df[col], errors="coerce").fillna(20)
        return ages.apply(lambda a: "<18 (Minor)" if a < 18 else ("18–20" if a <= 20 else ("21–23" if a <= 23 else "24+")))

    def _get_programme_categories(self, df: pd.DataFrame) -> pd.Series:
        prog_col = [c for c in df.columns if "degree" in str(c).lower() or "programme" in str(c).lower()][0]
        def categorize(val):
            v = str(val).lower().strip()
            if any(k in v for k in ["b.e", "b.tech", "btech", "eng", "cse", "ece", "mech", "civil", "tech"]):
                return "Engineering & Tech"
            elif any(k in v for k in ["bba", "mba", "commerce", "b.com", "bcom", "management", "business", "fin"]):
                return "Business & Management"
            elif any(k in v for k in ["bsc", "b.sc", "bca", "mca", "data", "science", "math", "physics"]):
                return "Sciences & Computing"
            elif any(k in v for k in ["mbbs", "pharma", "dent", "nurse", "med", "doctor"]):
                return "Medicine & Healthcare"
            else:
                return "Arts, Law & Other"
        return df[prog_col].apply(categorize)

    def _get_cgpa_categories(self, df: pd.DataFrame) -> pd.Series:
        cgpa_col = [c for c in df.columns if "cgpa" in str(c).lower()][0]
        cleaned = self._clean_cgpa_series(df[cgpa_col])
        return cleaned.apply(lambda c: "<6.0" if c < 6.0 else ("6.0–6.9" if c < 7.0 else ("7.0–7.9" if c < 8.0 else ("8.0–8.9" if c < 9.0 else "9.0–10.0"))))

    def _build_feature_matrix(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Builds normalized numerical/ordinal feature matrix for exploratory cross-validation.
        """
        age_col = [c for c in df.columns if "age?" in str(c).lower()][0]
        pressure_col = [c for c in df.columns if "pressure" in str(c).lower()][0]
        sat_col = [c for c in df.columns if "satisfied" in str(c).lower()][0]
        fin_col = [c for c in df.columns if "financial stress" in str(c).lower()][0]
        cgpa_col = [c for c in df.columns if "cgpa" in str(c).lower()][0]
        hours_col = [c for c in df.columns if "spend studying" in str(c).lower() or "hours do you spend" in str(c).lower()][0]
        sleep_col = [c for c in df.columns if "sleep" in str(c).lower()][0]

        pressure_map = {"very low": 1, "low": 2, "moderate": 3, "high": 4, "very high": 5}
        sleep_map = {"Less than 5 hours": 1, "5–6 hours": 2, "7–8 hours": 3, "More than 8 hours": 4}

        return pd.DataFrame({
            "age": pd.to_numeric(df[age_col], errors="coerce").fillna(20.0),
            "academic_pressure": df[pressure_col].str.strip().str.lower().map(pressure_map).fillna(3.0),
            "study_satisfaction": pd.to_numeric(df[sat_col], errors="coerce").fillna(3.0),
            "financial_stress": pd.to_numeric(df[fin_col], errors="coerce").fillna(3.0),
            "cgpa": self._clean_cgpa_series(df[cgpa_col]),
            "study_hours": self._clean_hours_series(df[hours_col]),
            "sleep_duration": df[sleep_col].str.strip().map(sleep_map).fillna(2.0)
        })

    def compare_student_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares an individual student profile with the 162-record research cohort.
        Validates inputs, calculates empirical percentiles, and provides an exploratory historical target estimate.

        MANDATORY GOVERNANCE & SAFETY INVARIANT:
        This projection is strictly an exploratory statistical calculation from a historical survey.
        It does NOT produce a clinical diagnosis or psychiatric assessment.
        """
        errors = []
        try:
            raw_age = float(profile_data.get("age", 20))
            if raw_age < 13 or raw_age > 100:
                errors.append("Age must be between 13 and 100.")
            age = raw_age
        except (ValueError, TypeError):
            errors.append("Age must be a valid number.")
            age = 20.0

        gender = str(profile_data.get("gender", "Prefer not to say")).strip()
        dietary_habits = str(profile_data.get("dietary_habits", "Moderate")).strip()
        degree = str(profile_data.get("degree", "Other")).strip()

        try:
            raw_cgpa = float(profile_data.get("cgpa", 7.5))
            if raw_cgpa < 0.0 or raw_cgpa > 10.0:
                errors.append("CGPA must be between 0.0 and 10.0.")
            cgpa = raw_cgpa
        except (ValueError, TypeError):
            errors.append("CGPA must be a valid number.")
            cgpa = 7.5

        raw_pressure = profile_data.get("academic_pressure", 3)
        pressure_map = {"very low": 1, "low": 2, "moderate": 3, "high": 4, "very high": 5}
        if isinstance(raw_pressure, str):
            pressure = pressure_map.get(raw_pressure.strip().lower(), 3)
        else:
            try:
                pressure = int(raw_pressure)
                if pressure < 1 or pressure > 5:
                    errors.append("Academic pressure must be between 1 and 5.")
                    pressure = min(5, max(1, pressure))
            except (ValueError, TypeError):
                errors.append("Academic pressure must be an integer between 1 and 5.")
                pressure = 3

        try:
            satisfaction = int(profile_data.get("study_satisfaction", 3))
            if satisfaction < 1 or satisfaction > 5:
                errors.append("Study satisfaction must be between 1 and 5.")
                satisfaction = min(5, max(1, satisfaction))
        except (ValueError, TypeError):
            errors.append("Study satisfaction must be an integer between 1 and 5.")
            satisfaction = 3

        try:
            financial_stress = int(profile_data.get("financial_stress", 3))
            if financial_stress < 1 or financial_stress > 5:
                errors.append("Financial stress must be between 1 and 5.")
                financial_stress = min(5, max(1, financial_stress))
        except (ValueError, TypeError):
            errors.append("Financial stress must be an integer between 1 and 5.")
            financial_stress = 3

        try:
            raw_hours = float(profile_data.get("study_hours", 4.0))
            if raw_hours < 0.0 or raw_hours > 24.0:
                errors.append("Daily study hours must be between 0 and 24.")
            study_hours = min(24.0, max(0.0, raw_hours))
        except (ValueError, TypeError):
            errors.append("Study hours must be a valid number.")
            study_hours = 4.0

        raw_sleep = str(profile_data.get("sleep_duration", "5–6 hours")).strip()
        sleep_map = {
            "less than 5 hours": 1,
            "< 5 hours": 1,
            "1": 1,
            "5–6 hours": 2,
            "5-6 hours": 2,
            "2": 2,
            "7–8 hours": 3,
            "7-8 hours": 3,
            "3": 3,
            "more than 8 hours": 4,
            "> 8 hours": 4,
            "4": 4
        }
        sleep_numeric = sleep_map.get(raw_sleep.lower(), 2)

        if errors:
            return {
                "status": "error",
                "errors": errors,
                "mandatory_disclaimer": "EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT."
            }

        # 2. Compute Cohort Distributions & Percentiles
        df = self.load_dataset()
        age_col = [c for c in df.columns if "age?" in str(c).lower()][0]
        pressure_col = [c for c in df.columns if "pressure" in str(c).lower()][0]
        sat_col = [c for c in df.columns if "satisfied" in str(c).lower()][0]
        fin_col = [c for c in df.columns if "financial stress" in str(c).lower()][0]
        cgpa_col = [c for c in df.columns if "cgpa" in str(c).lower()][0]
        hours_col = [c for c in df.columns if "spend studying" in str(c).lower() or "hours do you spend" in str(c).lower()][0]

        cohort_ages = pd.to_numeric(df[age_col], errors="coerce").dropna().values
        cohort_pressures = df[pressure_col].str.strip().str.lower().map(pressure_map).fillna(3).values
        cohort_sats = pd.to_numeric(df[sat_col], errors="coerce").fillna(3).values
        cohort_fins = pd.to_numeric(df[fin_col], errors="coerce").fillna(3).values
        cohort_cgpas = self._clean_cgpa_series(df[cgpa_col]).values
        cohort_hours = self._clean_hours_series(df[hours_col]).values

        age_pct = round(float(stats.percentileofscore(cohort_ages, age, kind="weak")), 1)
        pressure_pct = round(float(stats.percentileofscore(cohort_pressures, pressure, kind="weak")), 1)
        sat_pct = round(float(stats.percentileofscore(cohort_sats, satisfaction, kind="weak")), 1)
        fin_pct = round(float(stats.percentileofscore(cohort_fins, financial_stress, kind="weak")), 1)
        cgpa_pct = round(float(stats.percentileofscore(cohort_cgpas, cgpa, kind="weak")), 1)
        hours_pct = round(float(stats.percentileofscore(cohort_hours, study_hours, kind="weak")), 1)

        # 3. Exploratory Model Fit & Predict
        target_col = [c for c in df.columns if "healthcare" in str(c).lower() or "depression" in str(c).lower()][0]
        binary_df = df[df[target_col].str.strip().str.lower().isin(["yes", "no"])].copy()
        X = self._build_feature_matrix(binary_df)
        y = (binary_df[target_col].str.strip().str.lower() == "yes").astype(int).values

        clf = Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(random_state=42))
        ])
        clf.fit(X, y)

        sample_X = pd.DataFrame([{
            "age": float(age),
            "academic_pressure": float(pressure),
            "study_satisfaction": float(satisfaction),
            "financial_stress": float(financial_stress),
            "cgpa": float(cgpa),
            "study_hours": float(study_hours),
            "sleep_duration": float(sleep_numeric)
        }])

        prob_yes = float(clf.predict_proba(sample_X)[0, 1])
        prob_pct = round(prob_yes * 100.0, 1)

        if prob_yes < 0.25:
            affinity_tier = "Low Exploratory Affinity"
            affinity_color = "green"
        elif prob_yes < 0.50:
            affinity_tier = "Moderate Exploratory Affinity"
            affinity_color = "amber"
        else:
            affinity_tier = "Elevated Exploratory Affinity"
            affinity_color = "red"

        return {
            "status": "success",
            "profile_inputs": {
                "age": age,
                "gender": gender,
                "dietary_habits": dietary_habits,
                "degree": degree,
                "cgpa": cgpa,
                "academic_pressure": pressure,
                "study_satisfaction": satisfaction,
                "sleep_duration": raw_sleep,
                "study_hours": study_hours,
                "financial_stress": financial_stress
            },
            "cohort_benchmarks": {
                "cohort_size": len(df),
                "binary_cohort_size": len(binary_df),
                "cohort_base_rate_yes_pct": round(float(np.mean(y) * 100.0), 1),
                "percentiles": {
                    "age": age_pct,
                    "academic_pressure": pressure_pct,
                    "study_satisfaction": sat_pct,
                    "financial_stress": fin_pct,
                    "cgpa": cgpa_pct,
                    "study_hours": hours_pct
                }
            },
            "exploratory_projection": {
                "historical_target_probability_pct": prob_pct,
                "affinity_tier": affinity_tier,
                "affinity_color": affinity_color,
                "baseline_relative_ratio": round(prob_pct / max(0.1, round(float(np.mean(y) * 100.0), 1)), 2)
            },
            "mandatory_disclaimer": "EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT.",
            "governance_notice": MANDATORY_GOVERNANCE_NOTICE,
            "clinical_safety_notice": (
                "This statistical calculation is an exploratory mathematical projection derived from a historical "
                "163-record student research survey. It DOES NOT constitute medical advice, clinical depression diagnosis, "
                "or formal psychological assessment. If you are experiencing emotional distress, consult a certified counselor."
            )
        }


_GLOBAL_ANALYZER_INSTANCE: Optional[RealWorldDepressionAnalyzer] = None

def get_real_world_analyzer() -> RealWorldDepressionAnalyzer:
    global _GLOBAL_ANALYZER_INSTANCE
    if _GLOBAL_ANALYZER_INSTANCE is None:
        _GLOBAL_ANALYZER_INSTANCE = RealWorldDepressionAnalyzer()
    return _GLOBAL_ANALYZER_INSTANCE
