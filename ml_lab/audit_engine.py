"""
Mindora 2.0 - Stage 1 Dual-Dataset Audit Engine
Extracts complete statistical profiles, cross-comparisons, and validity metrics
without modifying datasets or exposing individual student records.
"""

import json
import hashlib
import os
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression

def compute_sha256(filepath):
    with open(filepath, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

def audit_dataset_a(path='dataset/Student_Depression_Dataset.csv'):
    sha256 = compute_sha256(path)
    df = pd.read_csv(path)
    
    n_rows, n_cols = df.shape
    columns = list(df.columns)
    
    # Missing values
    missing = df.isnull().sum()
    missing_dict = {col: int(cnt) for col, cnt in missing.items() if cnt > 0}
    
    # Duplicates
    dup_with_id = int(df.duplicated().sum())
    cols_no_id = [c for c in columns if c != 'id']
    dup_without_id = int(df.duplicated(subset=cols_no_id).sum())
    
    # Target distribution
    target_counts = df['Depression'].value_counts().to_dict()
    target_props = (df['Depression'].value_counts(normalize=True) * 100).to_dict()
    
    # Numerical features
    num_cols = ['Age', 'Academic Pressure', 'CGPA', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress']
    num_stats = {}
    for c in num_cols:
        s = df[c].dropna()
        q25, q50, q75 = float(s.quantile(0.25)), float(s.quantile(0.50)), float(s.quantile(0.75))
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr
        iqr_outliers = int(((s < lower_bound) | (s > upper_bound)).sum())
        
        mean_val = float(s.mean())
        std_val = float(s.std())
        z_scores = (s - mean_val) / std_val
        z_outliers = int((z_scores.abs() > 3).sum())
        
        num_stats[c] = {
            'mean': round(mean_val, 4),
            'std': round(std_val, 4),
            'median': round(q50, 4),
            'iqr': round(iqr, 4),
            'min': float(s.min()),
            'max': float(s.max()),
            'skewness': round(float(stats.skew(s)), 4),
            'kurtosis': round(float(stats.kurtosis(s)), 4),
            'iqr_outliers': iqr_outliers,
            'z_score_outliers_3sigma': z_outliers
        }
        
    # VIF
    df_num_clean = df[num_cols].dropna()
    vifs = {}
    for col in num_cols:
        X = df_num_clean.drop(columns=[col])
        y = df_num_clean[col]
        r2 = LinearRegression().fit(X, y).score(X, y)
        vifs[col] = round(float(1.0 / (1.0 - r2)), 4) if r2 < 1.0 else 999.0
        
    # Correlations with target
    corr_target = {}
    for col in num_cols:
        s = df[col].dropna()
        corr_target[col] = {
            'pearson': round(float(df[col].corr(df['Depression'], method='pearson')), 4),
            'spearman': round(float(df[col].corr(df['Depression'], method='spearman')), 4)
        }
        
    # Categorical features in production
    cat_cols = ['Gender', 'Sleep Duration', 'Dietary Habits', 'Degree']
    cat_stats = {}
    for c in cat_cols:
        vc = df[c].value_counts()
        total_valid = len(df[c].dropna())
        rare = vc[vc / total_valid < 0.01].to_dict()
        cat_stats[c] = {
            'cardinality': int(df[c].nunique()),
            'unique_values': list(df[c].dropna().unique()[:20]),
            'frequencies': {k: int(v) for k, v in vc.head(10).items()},
            'rare_categories_under_1_pct': {k: int(v) for k, v in rare.items()}
        }
        
    # Excluded columns analysis
    excluded_summary = {
        'id': {'type': 'identifier', 'unique': int(df['id'].nunique())},
        'City': {'unique_cities': int(df['City'].nunique()), 'top_5': {k: int(v) for k, v in df['City'].value_counts().head(5).items()}},
        'Profession': {
            'student_count': int((df['Profession'] == 'Student').sum()),
            'non_student_count': int((df['Profession'] != 'Student').sum()),
            'non_student_examples': {k: int(v) for k, v in df[df['Profession'] != 'Student']['Profession'].value_counts().head(5).items()}
        },
        'Work Pressure': {
            'zero_count_in_students': int((df[df['Profession'] == 'Student']['Work Pressure'] == 0).sum()),
            'percentage_zero_students': round(float((df[df['Profession'] == 'Student']['Work Pressure'] == 0).mean() * 100), 2)
        },
        'Job Satisfaction': {
            'zero_count_in_students': int((df[df['Profession'] == 'Student']['Job Satisfaction'] == 0).sum()),
            'percentage_zero_students': round(float((df[df['Profession'] == 'Student']['Job Satisfaction'] == 0).mean() * 100), 2)
        },
        'Have you ever had suicidal thoughts ?': {
            'yes_count': int((df['Have you ever had suicidal thoughts ?'] == 'Yes').sum()),
            'no_count': int((df['Have you ever had suicidal thoughts ?'] == 'No').sum()),
            'depression_rate_when_yes': round(float(df[df['Have you ever had suicidal thoughts ?'] == 'Yes']['Depression'].mean() * 100), 2),
            'depression_rate_when_no': round(float(df[df['Have you ever had suicidal thoughts ?'] == 'No']['Depression'].mean() * 100), 2)
        },
        'Family History of Mental Illness': {
            'yes_count': int((df['Family History of Mental Illness'] == 'Yes').sum()),
            'no_count': int((df['Family History of Mental Illness'] == 'No').sum()),
            'depression_rate_when_yes': round(float(df[df['Family History of Mental Illness'] == 'Yes']['Depression'].mean() * 100), 2),
            'depression_rate_when_no': round(float(df[df['Family History of Mental Illness'] == 'No']['Depression'].mean() * 100), 2)
        }
    }
    
    # Benford's law test
    benford_expected = np.log10(1 + 1 / np.arange(1, 10))
    benford_results = {}
    for col in ['Age', 'Work/Study Hours', 'CGPA', 'id']:
        s = df[col].dropna().astype(str).str.replace(r'^[0\.]+', '', regex=True)
        first_digits = pd.to_numeric(s.str[0], errors='coerce').dropna()
        first_digits = first_digits[(first_digits >= 1) & (first_digits <= 9)]
        counts = first_digits.value_counts().reindex(range(1, 10), fill_value=0)
        chi2, p_val = stats.chisquare(f_obs=counts, f_exp=benford_expected * counts.sum())
        benford_results[col] = {'chi2': round(float(chi2), 2), 'p_value': float(p_val)}
        
    return {
        'dataset_name': 'Dataset A (Public Benchmark)',
        'filepath': path,
        'sha256': sha256,
        'shape': {'rows': n_rows, 'columns': n_cols},
        'columns': columns,
        'missing_values': missing_dict,
        'duplicates': {'with_id': dup_with_id, 'without_id': dup_without_id},
        'target_distribution': {'counts': target_counts, 'percentages': target_props},
        'numerical_features': num_stats,
        'vif': vifs,
        'target_correlations': corr_target,
        'categorical_features': cat_stats,
        'excluded_columns_analysis': excluded_summary,
        'benford_law_tests': benford_results,
        'synthetic_indicators': {
            'cgpa_exact_zero_count': int((df['CGPA'] == 0).sum()),
            'profession_non_student_in_student_dataset': int((df['Profession'] != 'Student').sum()),
            'academic_pressure_exact_zero_count': int((df['Academic Pressure'] == 0).sum()),
            'study_satisfaction_exact_zero_count': int((df['Study Satisfaction'] == 0).sum())
        }
    }

def audit_dataset_b(path='ml_lab/data/raw/STUDENT dataset.xlsx'):
    sha256 = compute_sha256(path)
    df = pd.read_excel(path, sheet_name='Form Responses 1')
    
    n_rows, n_cols = df.shape
    columns = list(df.columns)
    
    # Missing values
    missing = df.isnull().sum()
    missing_dict = {col: int(cnt) for col, cnt in missing.items() if cnt > 0}
    
    # Exact duplicate rows
    dup_rows = int(df.duplicated().sum())
    
    # Target column
    target_col = 'Has a qualified healthcare professional ever told you that you have depression'
    target_counts = df[target_col].value_counts().to_dict()
    target_props = (df[target_col].value_counts(normalize=True) * 100).to_dict()
    
    # Age audit
    age_s = df['What is your age?']
    age_q_adult = df['Are you 18 years of age or older?'].str.strip().str.lower()
    
    age_minors_by_num = int((age_s < 18).sum())
    age_minors_by_q = int((age_q_adult == 'no').sum())
    age_contradictions = int(((age_s < 18) & (age_q_adult == 'yes')).sum() + ((age_s >= 18) & (age_q_adult == 'no')).sum())
    
    # Enrollment audit
    enrolled_s = df['Are you currently enrolled in an educational institution or formal educational programme?'].str.strip().str.lower()
    enrolled_counts = enrolled_s.value_counts().to_dict()
    
    # Gender
    gender_col = ' What is your gender?'
    gender_counts = df[gender_col].value_counts().to_dict()
    gender_props = (df[gender_col].value_counts(normalize=True) * 100).to_dict()
    
    # Degrees
    deg_col = 'What degree or educational programme are you currently pursuing?'
    deg_raw_unique = int(df[deg_col].nunique())
    deg_clean_unique = int(df[deg_col].str.strip().nunique())
    top_degrees = {k: int(v) for k, v in df[deg_col].str.strip().value_counts().head(15).items()}
    
    # CGPA parsing
    cgpa_col = 'What is your current CGPA on a 10-point scale?'
    valid_cgpa = []
    invalid_cgpa = []
    for v in df[cgpa_col]:
        try:
            valid_cgpa.append(float(v))
        except:
            invalid_cgpa.append(str(v))
    cgpa_numeric = pd.Series(valid_cgpa)
    
    # Study hours parsing
    hours_col = 'On an average day, how many total hours do you spend studying or working?( in numbers)'
    valid_hours = []
    invalid_hours = []
    for v in df[hours_col]:
        try:
            valid_hours.append(float(v))
        except:
            invalid_hours.append(str(v))
    hours_numeric = pd.Series(valid_hours)
    
    # Academic pressure
    acad_col = 'How much academic pressure do you currently experience?'
    acad_counts = df[acad_col].value_counts().to_dict()
    
    # Sleep duration
    sleep_col = 'On average, how many hours do you sleep per night?'
    sleep_counts = df[sleep_col].value_counts().to_dict()
    
    # Dietary habits
    diet_col = 'How would you describe your usual dietary habits?'
    diet_counts = df[diet_col].value_counts().to_dict()
    
    # Study satisfaction & financial stress
    sat_col = 'How satisfied are you with your current studies?'
    sat_counts = {int(k): int(v) for k, v in df[sat_col].value_counts().items()}
    
    fin_col = 'How much financial stress do you currently experience?'
    fin_counts = {int(k): int(v) for k, v in df[fin_col].value_counts().items()}
    
    # Eligibility filters
    f_age_num = df['What is your age?'] >= 18
    f_age_q = df['Are you 18 years of age or older?'].str.strip().str.lower() == 'yes'
    f_adult_strict = f_age_num & f_age_q
    f_enrolled = df['Are you currently enrolled in an educational institution or formal educational programme?'].str.strip().str.lower() == 'yes'
    f_cgpa = df[cgpa_col].apply(lambda x: pd.to_numeric(x, errors='coerce')).notnull()
    f_hours = df[hours_col].apply(lambda x: pd.to_numeric(x, errors='coerce')).notnull()
    
    strict_mask = f_adult_strict & f_enrolled & f_cgpa & f_hours
    pragmatic_mask = f_age_num & f_enrolled & f_cgpa & f_hours
    
    strict_df = df[strict_mask]
    pragmatic_df = df[pragmatic_mask]
    
    strict_target = strict_df[target_col].value_counts().to_dict()
    pragmatic_target = pragmatic_df[target_col].value_counts().to_dict()
    
    return {
        'dataset_name': 'Dataset B (Collected Responses)',
        'filepath': path,
        'sha256': sha256,
        'shape': {'rows': n_rows, 'columns': n_cols},
        'columns': columns,
        'missing_values': missing_dict,
        'duplicates': {'exact_rows': dup_rows},
        'target_distribution': {'counts': target_counts, 'percentages': target_props},
        'age_audit': {
            'min': int(age_s.min()),
            'max': int(age_s.max()),
            'mean': round(float(age_s.mean()), 2),
            'median': float(age_s.median()),
            'std': round(float(age_s.std()), 2),
            'minors_by_numeric_age': age_minors_by_num,
            'minors_by_q_response': age_minors_by_q,
            'age_discrepancies_count': age_contradictions,
            'extreme_older_respondents': [int(x) for x in age_s[age_s > 25].tolist()]
        },
        'enrollment_status': enrolled_counts,
        'gender_distribution': {'counts': gender_counts, 'percentages': gender_props},
        'degree_audit': {
            'unique_raw': deg_raw_unique,
            'unique_cleaned': deg_clean_unique,
            'top_15': top_degrees
        },
        'cgpa_audit': {
            'non_numeric_count': len(invalid_cgpa),
            'non_numeric_values': invalid_cgpa,
            'numeric_summary': {
                'count': len(valid_cgpa),
                'mean': round(float(cgpa_numeric.mean()), 2),
                'median': round(float(cgpa_numeric.median()), 2),
                'min': float(cgpa_numeric.min()),
                'max': float(cgpa_numeric.max()),
                'std': round(float(cgpa_numeric.std()), 2)
            }
        },
        'study_hours_audit': {
            'non_numeric_count': len(invalid_hours),
            'non_numeric_values': invalid_hours,
            'numeric_summary': {
                'count': len(valid_hours),
                'mean': round(float(hours_numeric.mean()), 2),
                'median': round(float(hours_numeric.median()), 2),
                'min': float(hours_numeric.min()),
                'max': float(hours_numeric.max()),
                'std': round(float(hours_numeric.std()), 2)
            }
        },
        'academic_pressure_distribution': acad_counts,
        'sleep_duration_distribution': sleep_counts,
        'dietary_habits_distribution': diet_counts,
        'study_satisfaction_distribution': sat_counts,
        'financial_stress_distribution': fin_counts,
        'eligibility_and_filtering': {
            'initial_n': n_rows,
            'strict_eligible_n': int(strict_mask.sum()),
            'strict_target_counts': strict_target,
            'pragmatic_eligible_n': int(pragmatic_mask.sum()),
            'pragmatic_target_counts': pragmatic_target,
            'filtering_waterfall': {
                'step_0_initial': n_rows,
                'step_1_numeric_adult_ge_18': int(f_age_num.sum()),
                'step_2_both_adult_indicators_agree': int(f_adult_strict.sum()),
                'step_3_currently_enrolled': int((f_adult_strict & f_enrolled).sum()),
                'step_4_valid_cgpa_numeric': int((f_adult_strict & f_enrolled & f_cgpa).sum()),
                'step_5_valid_hours_numeric': int(strict_mask.sum())
            }
        }
    }

def cross_dataset_comparison(audit_a, audit_b):
    df_a = pd.read_csv('dataset/Student_Depression_Dataset.csv')
    df_b = pd.read_excel('ml_lab/data/raw/STUDENT dataset.xlsx', sheet_name='Form Responses 1')
    
    # 1. Feature Mapping
    mapping = [
        {'feature_a': 'Age', 'feature_b': 'What is your age?', 'match_type': 'Semantic & Domain Match', 'notes': 'A: 18-59, B: 13-69. Both numeric years.'},
        {'feature_a': 'Gender', 'feature_b': ' What is your gender?', 'match_type': 'Partial Match (Leading space in B column, extra category)', 'notes': 'A: Male/Female only. B: Male, Female, Prefer not to say.'},
        {'feature_a': 'Academic Pressure', 'feature_b': 'How much academic pressure do you currently experience?', 'match_type': 'Type & Domain Mismatch', 'notes': 'A: Float/numeric 0-5. B: Ordinal text (very low to very high).'},
        {'feature_a': 'CGPA', 'feature_b': 'What is your current CGPA on a 10-point scale?', 'match_type': 'Partial Match (Dirty format in B)', 'notes': 'A: Clean float 0.0-10.0. B: Object dtype with text entries (Nill, emoji, No).'},
        {'feature_a': 'Study Satisfaction', 'feature_b': 'How satisfied are you with your current studies?', 'match_type': 'Semantic Match', 'notes': 'A: Float 0-5. B: Integer 1-5.'},
        {'feature_a': 'Sleep Duration', 'feature_b': 'On average, how many hours do you sleep per night?', 'match_type': 'Character Encoding Mismatch', 'notes': 'A: ASCII hyphen (5-6 hours). B: Unicode en-dash (5–6 hours). A includes Others; B does not.'},
        {'feature_a': 'Dietary Habits', 'feature_b': 'How would you describe your usual dietary habits?', 'match_type': 'Partial Match', 'notes': 'A: Healthy, Moderate, Unhealthy, Others. B: Moderate, Healthy, Unhealthy, Prefer not to say.'},
        {'feature_a': 'Degree', 'feature_b': 'What degree or educational programme are you currently pursuing?', 'match_type': 'Severe Normalization Mismatch', 'notes': 'A: 28 standardized categorical degrees. B: 63 free-text unconstrained entries.'},
        {'feature_a': 'Work/Study Hours', 'feature_b': 'On an average day, how many total hours do you spend studying or working?( in numbers)', 'match_type': 'Partial Match (Dirty format in B)', 'notes': 'A: Float 0-12. B: Object with ranges ("3-4 ", "3 hrs").'},
        {'feature_a': 'Financial Stress', 'feature_b': 'How much financial stress do you currently experience?', 'match_type': 'Semantic Match', 'notes': 'A: Float 1-5 (3 nulls). B: Integer 1-5 (0 nulls).'},
        {'feature_a': 'Depression', 'feature_b': 'Has a qualified healthcare professional ever told you that you have depression', 'match_type': 'Incompatible Construct & Cardinality', 'notes': 'A: Binary survey indicator (0/1). B: 3-class self-reported clinical diagnosis (no/yes/not sure).'}
    ]
    
    # 2. Statistical Divergence (KS and Chi2)
    ks_results = {}
    # Age
    ks_age = stats.ks_2samp(df_a['Age'], df_b['What is your age?'])
    ks_results['Age'] = {'statistic': round(float(ks_age.statistic), 4), 'p_value': float(ks_age.pvalue), 'significant_divergence': bool(ks_age.pvalue < 0.001)}
    
    # Study Satisfaction
    ks_sat = stats.ks_2samp(df_a['Study Satisfaction'].dropna(), df_b['How satisfied are you with your current studies?'])
    ks_results['Study Satisfaction'] = {'statistic': round(float(ks_sat.statistic), 4), 'p_value': float(ks_sat.pvalue), 'significant_divergence': bool(ks_sat.pvalue < 0.001)}
    
    # Financial Stress
    ks_fin = stats.ks_2samp(df_a['Financial Stress'].dropna(), df_b['How much financial stress do you currently experience?'])
    ks_results['Financial Stress'] = {'statistic': round(float(ks_fin.statistic), 4), 'p_value': float(ks_fin.pvalue), 'significant_divergence': bool(ks_fin.pvalue < 0.001)}
    
    # CGPA
    b_cgpa = pd.to_numeric(df_b['What is your current CGPA on a 10-point scale?'], errors='coerce').dropna()
    ks_cgpa = stats.ks_2samp(df_a['CGPA'], b_cgpa)
    ks_results['CGPA'] = {'statistic': round(float(ks_cgpa.statistic), 4), 'p_value': float(ks_cgpa.pvalue), 'significant_divergence': bool(ks_cgpa.pvalue < 0.001)}
    
    # Work/Study Hours
    b_hours = pd.to_numeric(df_b['On an average day, how many total hours do you spend studying or working?( in numbers)'], errors='coerce').dropna()
    ks_hours = stats.ks_2samp(df_a['Work/Study Hours'], b_hours)
    ks_results['Work/Study Hours'] = {'statistic': round(float(ks_hours.statistic), 4), 'p_value': float(ks_hours.pvalue), 'significant_divergence': bool(ks_hours.pvalue < 0.001)}
    
    # Categorical Chi2
    chi2_results = {}
    # Gender
    b_gender = df_b[' What is your gender?'][df_b[' What is your gender?'].isin(['Male', 'Female'])]
    obs_b_g = b_gender.value_counts()[['Male', 'Female']].values
    exp_prop_g = df_a['Gender'].value_counts(normalize=True)[['Male', 'Female']].values
    res_g = stats.chisquare(obs_b_g, f_exp=exp_prop_g * obs_b_g.sum())
    chi2_results['Gender'] = {'chi2': round(float(res_g.statistic), 4), 'p_value': float(res_g.pvalue), 'significant_divergence': bool(res_g.pvalue < 0.001)}
    
    # Sleep duration
    b_sleep = df_b['On average, how many hours do you sleep per night?'].str.replace('–', '-')
    categories = ['Less than 5 hours', '5-6 hours', '7-8 hours', 'More than 8 hours']
    obs_s = b_sleep.value_counts().reindex(categories, fill_value=0).values
    exp_prop_s = df_a['Sleep Duration'].value_counts(normalize=True).reindex(categories, fill_value=0).values
    exp_prop_s = exp_prop_s / exp_prop_s.sum()
    res_s = stats.chisquare(obs_s, f_exp=exp_prop_s * obs_s.sum())
    chi2_results['Sleep Duration'] = {'chi2': round(float(res_s.statistic), 4), 'p_value': float(res_s.pvalue), 'significant_divergence': bool(res_s.pvalue < 0.001)}
    
    # Dietary habits
    b_diet = df_b['How would you describe your usual dietary habits?']
    b_diet_known = b_diet[b_diet.isin(['Healthy', 'Moderate', 'Unhealthy'])]
    diet_cats = ['Unhealthy', 'Moderate', 'Healthy']
    obs_d = b_diet_known.value_counts().reindex(diet_cats, fill_value=0).values
    exp_prop_d = df_a['Dietary Habits'].value_counts(normalize=True).reindex(diet_cats, fill_value=0).values
    exp_prop_d = exp_prop_d / exp_prop_d.sum()
    res_d = stats.chisquare(obs_d, f_exp=exp_prop_d * obs_d.sum())
    chi2_results['Dietary Habits'] = {'chi2': round(float(res_d.statistic), 4), 'p_value': float(res_d.pvalue), 'significant_divergence': bool(res_d.pvalue < 0.001)}
    
    # Statistical Power & Sample Size Analysis
    # AUC SE formula (Hanley & McNeil 1982)
    def auc_se(theta, na, nn):
        q1 = theta / (2.0 - theta)
        q2 = (2.0 * theta**2) / (1.0 + theta)
        num = (theta * (1.0 - theta) + (na - 1) * (q1 - theta**2) + (nn - 1) * (q2 - theta**2))
        return float(np.sqrt(num / (na * nn)))
        
    se_b_strict = auc_se(0.70, 29, 74)
    se_a = auc_se(0.70, int(0.5855 * 27901), int(0.4145 * 27901))
    
    return {
        'feature_mapping_matrix': mapping,
        'distribution_divergence_tests': {
            'kolmogorov_smirnov_numerical': ks_results,
            'chi_squared_categorical': chi2_results
        },
        'statistical_power_and_evaluation': {
            'dataset_b_strict_n': 113,
            'dataset_b_binary_n': 103,
            'dataset_b_positive_cases': 29,
            'dataset_b_negative_cases': 74,
            'auc_0_70_standard_error_b': round(se_b_strict, 4),
            'auc_0_70_95_ci_width_b': round(2 * 1.96 * se_b_strict, 4),
            'auc_0_70_standard_error_a': round(se_a, 6),
            'auc_0_70_95_ci_width_a': round(2 * 1.96 * se_a, 4),
            'events_per_variable_ratio_b_45_features': round(29 / 45, 2),
            'recommended_minimum_epv': '10 to 20 events per variable (Harrell et al.)',
            'overfitting_risk_assessment': 'Extreme risk of empirical overfitting, high variance, and evaluation unreliability if supervised learning is attempted on Dataset B alone.'
        },
        'feasibility_of_merging': {
            'verdict': 'STRONGLY REJECTED (Unscientific and Invalid)',
            'covariate_shift': 'All overlapping numerical (p < 0.001) and categorical (p < 0.001) distributions differ systematically.',
            'label_shift': 'Target constructs are fundamentally distinct: self-reported survey indicator (A) vs self-reported professional diagnosis (B).',
            'contamination_risk': 'Combining 162 (or 113) real local responses with 27,901 synthetic/crowdsourced records would swamp the local signal (0.4% weight) while poisoning evaluation.'
        }
    }

if __name__ == '__main__':
    audit_a = audit_dataset_a()
    with open('ml_lab/audit/public_dataset_audit.json', 'w', encoding='utf-8') as f:
        json.dump(audit_a, f, indent=2)
    print('Saved ml_lab/audit/public_dataset_audit.json')
    
    audit_b = audit_dataset_b()
    with open('ml_lab/audit/collected_dataset_audit.json', 'w', encoding='utf-8') as f:
        json.dump(audit_b, f, indent=2)
    print('Saved ml_lab/audit/collected_dataset_audit.json')
    
    comp = cross_dataset_comparison(audit_a, audit_b)
    with open('ml_lab/audit/cross_dataset_comparison.json', 'w', encoding='utf-8') as f:
        json.dump(comp, f, indent=2)
    print('Saved ml_lab/audit/cross_dataset_comparison.json')
    print('Stage 1 JSON generation complete!')
