# MINDORA 2.0 — FEATURE CONTRACT SPECIFICATION
## Single Source of Truth for Python Training & TypeScript Inference

**Document Version:** 1.0.0  
**Date:** November 15, 2026  
**Status:** SPECIFICATION & ACTIVE CONTRACT (Stage 0 Foundation)  
**Contract Location:** `shared/contracts/feature_contract.json`  
**Test Fixtures Location:** `shared/fixtures/benchmark_cases.json`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  

---

## 1. Single Feature Contract Architecture

To prevent **training-serving skew** — one of the most common failure modes in machine learning deployments where client-side input encodings diverge from training data distributions — Mindora 2.0 establishes a machine-readable **Single Feature Contract**:

```
                              ┌────────────────────────────────────────┐
                              │ shared/contracts/feature_contract.json │
                              └───────────────────┬────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
┌─────────────────────────────────┐                               ┌─────────────────────────────────┐
│ ml_lab/preprocessing/           │                               │ frontend/src/contracts/         │
│ Python Pydantic Models          │                               │ TypeScript Zod Schemas          │
│ Scikit-learn Pipeline Config    │                               │ React Form Validation           │
└─────────────────────────────────┘                               └─────────────────────────────────┘
                 │                                                                 │
                 └────────────────────────────────┬────────────────────────────────┘
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │ shared/fixtures/benchmark_cases.json│
                               │ Automated Cross-Runtime Parity Test │
                               └─────────────────────────────────────┘
```

---

## 2. Feature Specification Matrix

Mindora 2.0 strictly enforces a **10-Feature Schema**. Features must appear in the exact deterministic order defined below:

| Index | Feature Key | Data Type | Permitted Bounds / Vocabulary | Imputation Strategy | Encoding / Transformation | Encoded Width |
|---|---|---|---|---|---|---|
| **0** | `Age` | `float64` | `[16.0, 55.0]` (Years) | Median (`21.0`) | StandardScaler | 1 |
| **1** | `Academic Pressure` | `float64` | `[1.0, 5.0]` (Ordinal scale) | Median (`3.0`) | StandardScaler | 1 |
| **2** | `CGPA` | `float64` | `[0.0, 10.0]` (Scale 10.0) | Median (`7.8`) | StandardScaler | 1 |
| **3** | `Study Satisfaction` | `float64` | `[1.0, 5.0]` (Ordinal scale) | Median (`3.0`) | StandardScaler | 1 |
| **4** | `Work/Study Hours` | `float64` | `[1.0, 14.0]` (Hours/day) | Median (`6.5`) | StandardScaler | 1 |
| **5** | `Financial Stress` | `float64` | `[1.0, 5.0]` (Ordinal scale) | Median (`3.0`) | StandardScaler | 1 |
| **6** | `Gender` | `string` | `["Female", "Male"]` | Most Frequent | OneHotEncoder (`handle_unknown='ignore'`) | 2 |
| **7** | `Sleep Duration` | `string` | `["5-6 hours", "7-8 hours", "Less than 5 hours", "More than 8 hours", "Others"]` | Most Frequent | OneHotEncoder (`handle_unknown='ignore'`) | 5 |
| **8** | `Dietary Habits` | `string` | `["Healthy", "Moderate", "Others", "Unhealthy"]` | Most Frequent | OneHotEncoder (`handle_unknown='ignore'`) | 4 |
| **9** | `Degree` | `string` | 28 Verified Degrees (see Section 3) | Most Frequent | OneHotEncoder (`handle_unknown='ignore'`) | 28 |
| **Total** | **10 Raw Features** | — | — | — | — | **45 Encoded Columns** |

---

## 3. Categorical Vocabularies & Encoding Alignment

### Categorical Feature 1: `Gender` (2 Categories)
- `["Female", "Male"]`

### Categorical Feature 2: `Sleep Duration` (5 Categories)
- `["5-6 hours", "7-8 hours", "Less than 5 hours", "More than 8 hours", "Others"]`

### Categorical Feature 3: `Dietary Habits` (4 Categories)
- `["Healthy", "Moderate", "Others", "Unhealthy"]`

### Categorical Feature 4: `Degree` (28 Categories)
```json
[
  "B.Arch", "B.Com", "B.Ed", "B.Pharm", "B.Tech", "BA", "BBA", "BCA", "BE", "BHM",
  "BSc", "Class 12", "LLB", "LLM", "M.Com", "M.Ed", "M.Pharm", "M.Tech", "MA", "MBA",
  "MBBS", "MCA", "MD", "ME", "MHM", "MSc", "Others", "PhD"
]
```

### Unknown Category Handling Policy
- Client-side and server-side preprocessors must configure `handle_unknown='ignore'`.
- If a student enters an unlisted degree (e.g. "B.Des"), all 28 one-hot degree columns are encoded as `0.0`. The model gracefully falls back to numerical and other demographic signals without crashing.

---

## 4. Code Generation Design

To guarantee bit-exact synchrony between Python and TypeScript, code generation scripts will parse `feature_contract.json` to generate type definitions:

### Target Python Pydantic Model (`ml_lab/preprocessing/contract_validator.py`):
```python
from pydantic import BaseModel, Field
from typing import Literal

class StudentFeaturePayload(BaseModel):
    Age: float = Field(ge=16.0, le=55.0)
    Academic_Pressure: float = Field(alias="Academic Pressure", ge=1.0, le=5.0)
    CGPA: float = Field(ge=0.0, le=10.0)
    Study_Satisfaction: float = Field(alias="Study Satisfaction", ge=1.0, le=5.0)
    Work_Study_Hours: float = Field(alias="Work/Study Hours", ge=1.0, le=14.0)
    Financial_Stress: float = Field(alias="Financial Stress", ge=1.0, le=5.0)
    Gender: Literal["Female", "Male"]
    Sleep_Duration: Literal["5-6 hours", "7-8 hours", "Less than 5 hours", "More than 8 hours", "Others"] = Field(alias="Sleep Duration")
    Dietary_Habits: Literal["Healthy", "Moderate", "Others", "Unhealthy"] = Field(alias="Dietary Habits")
    Degree: str
```

### Target TypeScript Zod Schema (`frontend/src/contracts/featureSchema.ts`):
```typescript
import { z } from 'zod';

export const StudentFeatureSchema = z.object({
  Age: z.number().min(16.0).max(55.0),
  "Academic Pressure": z.number().min(1.0).max(5.0),
  CGPA: z.number().min(0.0).max(10.0),
  "Study Satisfaction": z.number().min(1.0).max(5.0),
  "Work/Study Hours": z.number().min(1.0).max(14.0),
  "Financial Stress": z.number().min(1.0).max(5.0),
  Gender: z.enum(["Female", "Male"]),
  "Sleep Duration": z.enum(["5-6 hours", "7-8 hours", "Less than 5 hours", "More than 8 hours", "Others"]),
  "Dietary Habits": z.enum(["Healthy", "Moderate", "Others", "Unhealthy"]),
  Degree: z.string().max(100)
});
```

---

## 5. Automated Parity Verification Test

The integrity of this contract is continuously verified by `tests/model_parity/test_feature_contract.py`. The test suite asserts that:
1. The 10 approved features match the production pipeline feature ordering.
2. The categorical vocabularies in `feature_contract.json` match `models/best_model.pkl` one-hot encoder categories bit-for-bit.
3. Benchmark fixtures in `shared/fixtures/benchmark_cases.json` conform strictly to numeric bounds and produce deterministic reference outputs.
