# MINDORA 2.0 — STAGE 3A.5: FINAL IMPUTATION COLLISION VERIFICATION

**Document Ref:** `docs/experiments/STAGE_3A_5_IMPUTATION_COLLISION_VERIFICATION.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3A.5 Extended Imputation Collision & Preprocessing Compatibility Audit  
**Status:** Complete — **Stage 3B Remains Strictly Unauthorized & Not Started**  

---

## 1. OBJECTIVE & AUDIT SCOPE

Following the Stage 3A.4 review, this verification report extends the imputation collision audit for the 3 missing `Financial Stress` records in Dataset A.

While Stage 3A.4 evaluated integer domain values $\{1.0, 2.0, 3.0, 4.0, 5.0\}$, `SimpleImputer(strategy='median')` calculated independently on an even-sized training fold can evaluate to half-integers (e.g., $(2 + 3)/2 = 2.5$).

This document executes and records:
1. An **extended collision sweep** testing all half-step values:
   $$\mathcal{V}_{\text{half-step}} = \{1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0\}$$
2. Verification that the 3 missing records do not collide with each other.
3. An audit of **preprocessing compatibility** in `src/preprocessing.py`, `models/best_model.pkl`, and `shared/contracts/feature_contract.json`.

---

## 2. THE THREE MISSING FINANCIAL STRESS OBSERVATIONS

Dataset A ($N=27,901$) contains exactly 3 records ($0.0108\%$) with null `Financial Stress`:

```
┌──────────┬────────┬──────┬───────┬──────┬──────────┬─────────┬────────┬───────────┬─────────┬────────┬─────┐
│ Row Idx  │ ID     │ Age  │ AcadP │ CGPA │ StudySat │ WorkHrs │ Gender │ Sleep     │ Diet    │ Degree │ Dep │
├──────────┼────────┼──────┼───────┼──────┼──────────┼─────────┼────────┼───────────┼─────────┼────────┼─────┤
│ 4458     │ 22377  │ 32.0 │  3.0  │ 5.64 │   1.0    │  12.0   │ Male   │ < 5 hours │ Healthy │ BCA    │  1  │
│ 13596    │ 68910  │ 29.0 │  2.0  │ 8.94 │   3.0    │  12.0   │ Male   │ < 5 hours │ Moderate│ B.Ed   │  0  │
│ 19266    │ 97610  │ 20.0 │  1.0  │ 6.83 │   1.0    │   9.0   │ Male   │ < 5 hours │ Healthy │ MBBS   │  0  │
└──────────┴────────┴──────┴───────┴──────┴──────────┴─────────┴────────┴───────────┴─────────┴────────┴─────┘
```

---

## 3. 9-FEATURE PRE-IMPUTATION UNIQUENESS PROOF

Before evaluating any candidate value for `Financial Stress`, the uniqueness of each missing record was audited across the **other 9 complete model features** (`Age`, `Academic Pressure`, `CGPA`, `Study Satisfaction`, `Work/Study Hours`, `Gender`, `Sleep Duration`, `Dietary Habits`, `Degree`):

- **Row 4458:** Matching rows in Dataset A across the other 9 features: **0 rows**.
- **Row 13596:** Matching rows in Dataset A across the other 9 features: **0 rows**.
- **Row 19266:** Matching rows in Dataset A across the other 9 features: **0 rows**.

> [!IMPORTANT]
> Each of the three missing records is **ALREADY 100% UNIQUE** in Dataset A based solely on the other 9 features. Even if `Financial Stress` were completely ignored or removed, none of these 3 records would match any other record in the $27,901$-row dataset.

---

## 4. EXTENDED HALF-STEP COLLISION SWEEP MATRIX

For each missing record, every half-step value $v \in \{1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0\}$ was substituted into `Financial Stress`, and the full 10-feature signature was compared against all other $27,900$ rows in Dataset A:

```
┌──────────┬────────┬──────┬──────┬────────┬───────────────────────────────────────────────────────────────┐
│ Row Idx  │ ID     │ Age  │ CGPA │ Degree │ Collisions for v in {1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0}│
├──────────┼────────┼──────┼──────┼────────┼───────────────────────────────────────────────────────────────┤
│ 4458     │ 22377  │ 32.0 │ 5.64 │ BCA    │ 1.0: 0 | 1.5: 0 | 2.0: 0 | 2.5: 0 | 3.0: 0 | 3.5: 0 | 4.0: 0 | 4.5: 0 | 5.0: 0 │
│ 13596    │ 68910  │ 29.0 │ 8.94 │ B.Ed   │ 1.0: 0 | 1.5: 0 | 2.0: 0 | 2.5: 0 | 3.0: 0 | 3.5: 0 | 4.0: 0 | 4.5: 0 | 5.0: 0 │
│ 19266    │ 97610  │ 20.0 │ 6.83 │ MBBS   │ 1.0: 0 | 1.5: 0 | 2.0: 0 | 2.5: 0 | 3.0: 0 | 3.5: 0 | 4.0: 0 | 4.5: 0 | 5.0: 0 │
└──────────┴────────┴──────┴──────┴────────┴───────────────────────────────────────────────────────────────┘
```

### Pairwise Mutual Exclusivity:
Testing the 3 missing records against one another across the 9 complete features:
- Row 4458 vs Row 13596: **False** (Different Age, CGPA, Degree, etc.).
- Row 4458 vs Row 19266: **False** (Different Age, CGPA, Degree, etc.).
- Row 13596 vs Row 19266: **False** (Different Age, CGPA, Degree, etc.).

**Finding:** The 3 missing records are mutually exclusive. No pair among them can collide under identical or divergent imputation values.

---

## 5. PREPROCESSING COMPATIBILITY & EXHAUSTIVE COVERAGE PROOF

### 5.1 Permissibility of Half-Integer Medians in Production Preprocessing
Inspection of the production pipeline (`models/best_model.pkl`) and `src/preprocessing.py` confirms:
1. `preprocessor.named_transformers_['num']` consists of:
   ```python
   Pipeline(steps=[
       ('imputer', SimpleImputer(strategy='median')),
       ('scaler', StandardScaler())
   ])
   ```
2. Scikit-Learn's `SimpleImputer(strategy='median')` internally evaluates `np.nanmedian(X, axis=0)`.
3. When fitted on an even number of observed samples with split median values, `np.nanmedian` computes the arithmetic mean $(x_{(k)} + x_{(k+1)})/2$.
4. The output array of `SimpleImputer` is `float64`, and `StandardScaler` standardizes continuous floats using $(x - \mu)/\sigma$.
5. **Verdict:** Half-integer median values are **fully permitted and naturally supported** by the preprocessing pipeline without truncation, integer casting, or type errors.

### 5.2 Mathematical Proof of Exhaustive Sweep Coverage
- Let $S \subset \{1, 2, 3, 4, 5\}$ be the observed non-null integer values of `Financial Stress` in any arbitrary training fold partition.
- The median of any multiset of integers from $\{1, 2, 3, 4, 5\}$ is defined as:
  $$\text{median}(S) = \begin{cases} s_{(m)} & \text{if } |S| \text{ is odd} \\ \frac{s_{(m)} + s_{(m+1)}}{2} & \text{if } |S| \text{ is even} \end{cases}$$
- If $|S|$ is odd, $s_{(m)} \in \{1, 2, 3, 4, 5\}$.
- If $|S|$ is even, the median is the **average of any two integers from the domain {1, 2, 3, 4, 5}**, $s_{(m)}, s_{(m+1)} \in \{1, 2, 3, 4, 5\}$. Evaluating all possible pairs $(a + b)/2$ for $a, b \in \{1, 2, 3, 4, 5\}$ yields:
  $$\frac{a + b}{2} \in \{1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0\}$$
- **Mathematical Conclusion:** The 9 half-step values tested in Section 4 constitute the **complete set of all possible medians** that can ever be generated by `SimpleImputer` on any fold of Dataset A.
- Therefore, the collision-free guarantee is **mathematically exhaustive and unconditional**.

### 5.3 Downstream Transformation Collision Audit
- **StandardScaler Affine Invariance:** `StandardScaler` applies $f(x) = \frac{x - \mu}{\sigma}$. Since $\sigma > 0$, $f$ is strictly monotonic. $f(x_1) = f(x_2) \iff x_1 = x_2$. Scaling cannot create new duplicate vectors from distinct inputs.
- **OneHotEncoder Orthogonality:** All categorical variables map to orthogonal binary indicator columns. Distinct categorical tuples map to distinct binary representations.

---

## 6. LIMITATIONS & EPISTEMIC BOUNDARIES

1. **Synthetic and Public Benchmark Scope:** These findings reflect the exact properties of Dataset A (`dataset/Student_Depression_Dataset.csv`). They do not imply that missing-data patterns in external university cohorts would exhibit identical uniqueness.
2. **Read-Only Non-Destructive Audit:** This verification was conducted strictly via in-memory diagnostic comparisons. Zero production code, serialized models, pipelines, feature contracts, or dataset files were altered.

---

## 7. CONCLUSION & SIGN-OFF

1. **Exhaustive Collision Verification:** Across all 9 possible integer and half-integer median values $\{1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0\}$, the 3 records with missing `Financial Stress` produce **zero collisions** with any other row in Dataset A.
2. **Total Duplicate Count Invariance:** The total number of duplicate feature rows in Dataset A is **invariant at exactly 4 rows (2 unique groups: Group 1 and Group 2)** across all possible fold-isolated median imputations.
3. **Stage 3A Status:** All preflight validation criteria, grouping functions, and imputation properties are fully verified.

**Stage 3B remains unauthorized. All experimental training, data splitting on disk, probability calibration, and benchmarking remain on strict standby pending explicit user instruction.**
