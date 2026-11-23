# Mindora 2.0 — Stage 3B.1.6 Audit Report
## Test Artifact Isolation Hardening & Zero-Pollution Verification

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-15  
**Stage:** Stage 3B.1.6 (Pre-Research Infrastructure Hardening)  
**Branch:** `mindora-2.0-rebuild`  
**Working Directory:** `D:\Depression calculator`  
**Execution Authorization Status:** Stage 3B.1.6 Authorized; Stage 3B.2 Strictly Unauthorized  

---

### Executive Summary

In Stage 3B.1.5, an artifact inventory revealed that 33 untracked model files in `experiments/models/` and 33 corresponding entries in `experiments/registry.json` were produced on 2026-11-15 by running `tests/test_training_platform.py` against synthetic in-memory fixtures. While the audit proved that neither Dataset A nor the new Test Vault had been accessed, it identified a **test-isolation defect**: the automated test suite directly mutated production experiment directories and the production experiment registry during testing.

In this Stage 3B.1.6 hardening pass:
1. **Root Cause Resolved:** We identified and eliminated the hardcoded dependency on production directories (`MODELS_DIR = "experiments/models"` and `REGISTRY_FILE = "experiments/registry.json"`).
2. **Dual-Layer Isolation Implemented:**
   - **Layer 1 (Dependency Injection):** `run_training_experiment()`, `save_experiment()`, `list_experiments()`, `get_experiment()`, `check_validation_candidacy_eligibility()`, `promote_to_validation_candidate()`, and `approve_model_artifact()` now accept explicit `models_dir` and `registry_file` overrides.
   - **Layer 2 (Context-Managed Scoped Sandboxing):** Introduced `isolated_experiment_context(base_dir=None, seed_with_existing=True)` in `src/training/experiment_registry.py`. When active, it redirects all registry and model saving to an isolated temporary sandbox (`tempfile.mkdtemp(prefix="mindora_test_exp_")`) and guarantees automatic physical teardown upon exit, leaving production directories untouched even if individual callers omit explicit path parameters.
3. **Automated Test Suite Hardened:** `tests/test_training_platform.py` was wrapped inside `isolated_experiment_context()`, and tests 7, 8, 12, 13, and 14 were upgraded to pass explicit sandbox paths.
4. **Zero-Pollution Empirically Verified:** Executing `tests/test_training_platform.py` (15 tests) and the entire project test suite (`python -m unittest discover -s tests`, 126 tests) resulted in **0 new files** written to `experiments/models/` and **0 byte alterations** to `experiments/registry.json`.
5. **Zero Deserialization & Preservation Guarantee:** None of the 46 existing model artifacts were deserialized, overwritten, renamed, or deleted. All 46 SHA-256 digests remain bit-identical to the Stage 3B.1.5 baseline. `models/best_model.pkl`, Dataset A, Dataset B, and the Test Vault remain completely quarantined and unmodified.

---

### 1. Root Cause Analysis of Test Pollution

Prior to Stage 3B.1.6, the training platform and registry architecture had the following structural coupling:

1. **Hardcoded Module-Level Paths:**
   - In `src/training/experiment_registry.py`, `REGISTRY_FILE` was statically defined as `os.path.join(EXPERIMENTS_DIR, "registry.json")` and `MODELS_DIR` as `os.path.join(EXPERIMENTS_DIR, "models")`.
   - Functions `_load_raw_registry()`, `_save_raw_registry()`, and `save_experiment()` lacked parameterization for destination paths.
2. **Direct Pipeline Dump in Training Orchestrator:**
   - In `src/training/train.py`, `run_training_experiment()` directly assembled `artifact_path = os.path.join(MODELS_DIR, f"{exp_id}.pkl")` and invoked `joblib.dump(full_pipeline, artifact_path)`.
   - It then called `save_experiment(run)` which unconditionally wrote to `experiments/registry.json`.
3. **Automated Test Invocations:**
   - `test_7_reproducible_model_training_and_metrics()` executed `run_training_experiment()` twice per test run.
   - `test_8_offline_execution_enforcement()` executed `run_training_experiment()` once per test run.
   - `test_14_registry_state_transitions()` invoked `promote_to_validation_candidate()` and `approve_model_artifact()`, mutating the existing registry entries in place.
   - Across 15 test suite runs conducted during Day 12 and subsequent verification passes, exactly 33 model files and 33 registry entries accumulated in `experiments/models/`.

---

### 2. Architectural Hardening Implementation

To achieve robust isolation without introducing external dependencies or breaking backwards compatibility, a dual-layer isolation strategy was implemented.

#### A. Scoped Sandboxing & Parameter Injection (`src/training/experiment_registry.py`)
- Added thread/process-level overrides `_ACTIVE_REGISTRY_FILE` and `_ACTIVE_MODELS_DIR`.
- Implemented path getter utilities:
  - `get_registry_file() -> str`: Returns `_ACTIVE_REGISTRY_FILE or REGISTRY_FILE`.
  - `get_models_dir() -> str`: Returns `_ACTIVE_MODELS_DIR or MODELS_DIR`.
- Implemented `isolated_experiment_context(base_dir=None, seed_with_existing=True)`:
  ```python
  @contextlib.contextmanager
  def isolated_experiment_context(
      base_dir: Optional[str] = None,
      seed_with_existing: bool = True
  ) -> Generator[Tuple[str, str], None, None]:
      temp_dir = tempfile.mkdtemp(prefix="mindora_test_exp_", dir=base_dir)
      isolated_models = os.path.join(temp_dir, "models")
      os.makedirs(isolated_models, exist_ok=True)
      isolated_reg = os.path.join(temp_dir, "registry.json")
      
      if seed_with_existing and os.path.exists(REGISTRY_FILE):
          shutil.copy2(REGISTRY_FILE, isolated_reg)
      else:
          with open(isolated_reg, "w", encoding="utf-8") as f:
              json.dump({"experiments": []}, f)
              
      prev_reg = _ACTIVE_REGISTRY_FILE
      prev_models = _ACTIVE_MODELS_DIR
      _ACTIVE_REGISTRY_FILE = isolated_reg
      _ACTIVE_MODELS_DIR = isolated_models
      try:
          yield (isolated_models, isolated_reg)
      finally:
          _ACTIVE_REGISTRY_FILE = prev_reg
          _ACTIVE_MODELS_DIR = prev_models
          shutil.rmtree(temp_dir, ignore_errors=True)
  ```
- Updated `_load_raw_registry(registry_file=None)`, `_save_raw_registry(data, registry_file=None)`, `save_experiment(run, registry_file=None)`, `list_experiments(registry_file=None)`, `get_experiment(exp_id, registry_file=None)`, and `compare_experiments(ids, registry_file=None)` to accept optional `registry_file` overrides.

#### B. Training Orchestrator Hardening (`src/training/train.py`)
- Updated `run_training_experiment()` signature to accept `models_dir: Optional[str] = None` and `registry_file: Optional[str] = None`.
- Dynamically resolves target model directory via `models_dir or get_models_dir()`.
- Persists model artifact strictly into the resolved target directory: `os.path.join(target_models_dir, f"{exp_id}.pkl")`.
- Dispatches experiment logging to `save_experiment(run, registry_file=registry_file)`.

#### C. Governance & Model Registry Hardening (`src/training/model_registry.py`)
- Updated `check_validation_candidacy_eligibility(experiment_id, registry_file=None)`.
- Updated `promote_to_validation_candidate(experiment_id, registry_file=None)`.
- Updated `approve_model_artifact(experiment_id, operator_name, registry_file=None)`.
- All governance queries and status updates now operate against the designated registry file without touching `experiments/registry.json`.

#### D. Package Exports (`src/training/__init__.py`)
- Exported `get_registry_file`, `get_models_dir`, and `isolated_experiment_context` in `__all__`.

#### E. Test Suite Hardening (`tests/test_training_platform.py`)
- Tests 7, 8, 12, 13, and 14 now accept injected sandbox parameters and wrap executions in `isolated_experiment_context()` fallback blocks.
- `run_all_platform_tests()` wraps the entire 15-test execution flow inside `with isolated_experiment_context(seed_with_existing=True) as (temp_models, temp_reg):`.
- Any artifacts created during test runs are written to the temporary directory and completely removed from the filesystem upon test completion.

---

### 3. Empirical Verification: Pre- vs Post-Hardening Baselines

To prove that zero test pollution occurs, exact cryptographic and filesystem assertions were evaluated before and after running tests.

| Artifact / Path | Pre-Hardening Baseline | Post-Test Execution (Post-Hardening) | Status |
| :--- | :--- | :--- | :--- |
| `experiments/models/` file count | **46 files** | **46 files** | **Bit-Identical (0 files added)** |
| `experiments/registry.json` SHA-256 | `68BBA7AC59902C2577C8764D6DD8AB7809912DAB196E69E59A1B9B481229E04B` | `68BBA7AC59902C2577C8764D6DD8AB7809912DAB196E69E59A1B9B481229E04B` | **Bit-Identical (0 bytes changed)** |
| `models/best_model.pkl` SHA-256 | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | **Bit-Identical (Untouched)** |
| `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | **Bit-Identical (Untouched)** |
| `ml_lab/data/raw/STUDENT dataset.xlsx` | 19,502 bytes (Quarantined) | 19,502 bytes (Quarantined) | **Zero Access (Quarantined)** |
| `ml_lab/splits/group_aware_partition_manifest.json` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | **Bit-Identical (Untouched)** |
| `ml_lab/splits/partition_assignments.csv` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | **Bit-Identical (Untouched)** |
| Temporary sandbox directory | None | Automatically unlinked / deleted | **Zero Residual Files** |

#### Verification of Existing 46 Artifacts
All 46 pre-existing model files in `experiments/models/` (13 historical Day 12 exploration artifacts and 33 pre-hardening test artifacts) were checked against the Stage 3B.1.5 inventory.
- **Deserialization Check:** Zero model files were unpickled or loaded during hashing.
- **Hash Integrity:** All 46 digests match the Stage 3B.1.5 catalog exactly.
- **Modification Check:** No files were renamed, deleted, moved, or overwritten.

---

### 4. Test Suite Execution & Regression Audit

Two separate test invocations were executed to guarantee full test pass rates and zero regressions:

#### A. Dedicated Platform Test Suite (`tests/test_training_platform.py`)
```
======================================================================
MINDORA LOCAL AI/ML TRAINING PLATFORM TEST SUITE
======================================================================
PASS: Test 1 - Dataset loading and SHA-256 fingerprinting verified.
PASS: Test 2 - Invalid CSV handling verified.
PASS: Test 3 - Profiling, nulls, and constant column detection verified.
PASS: Test 4 - Target validation and target leakage rejection verified.
PASS: Test 5 - Train/Validation/Test split isolation verified.
PASS: Test 6 - Preprocessing leakage prevention verified.
PASS: Test 7 - Reproducible training and artifact persistence verified.
PASS: Test 8 - 100% Offline execution verified under network block.
PASS: Test 9 - Production baseline model preservation verified.
PASS: Test 10 - Metric and confusion matrix consistency verified.
PASS: Test 11 - Class ordering (0=negative, 1=positive) verified.
PASS: Test 12 - Validation-only candidate selection verified.
PASS: Test 13 - Prevention of automatic production promotion verified.
PASS: Test 14 - Model registry state transitions verified.
PASS: Test 15 - Baseline Brier score derivation & probability source verified.
======================================================================
ALL 15 PLATFORM TESTS COMPLETED WITH 100% SUCCESS!
======================================================================
```
- **Execution Time:** ~2.8 seconds.
- **Pollution:** 0 files added to `experiments/models/`; `experiments/registry.json` untouched.

#### B. Full Project Unit & Regression Test Suite (`python -m unittest discover -s tests`)
```
----------------------------------------------------------------------
Ran 126 tests in 0.731s

OK
```
- **Results:** 126 tests run, 0 failures, 0 errors. Zero regressions across privacy, security, data platform, recommendation engine, offline reliability, and UX test suites.

---

### 5. Git Status and Working Tree State

The repository was audited to ensure compliance with the strict Git preservation rules. No commits, branch switches, stashes, resets, or clean commands were executed.

```
On branch mindora-2.0-rebuild
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/DAY_12_DATA_RETENTION_MATRIX.md
	modified:   experiments/registry.json
	modified:   src/privacy_policy.py
	modified:   src/training/__init__.py
	modified:   src/training/experiment_registry.py
	modified:   src/training/model_registry.py
	modified:   src/training/train.py
	modified:   tests/test_day12_privacy_architecture.py
	modified:   tests/test_training_platform.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/architecture/
	docs/data/
	docs/experiments/
	docs/operations/
	docs/research/
	experiments/models/exp_20261115_... (33 preserved test artifacts from prior runs)
	ml_lab/
	resources/
	scripts/generate_fixtures.py
	shared/
	tests/model_parity/

no changes added to commit (use "git add" and/or "git commit -a")
```

---

### 6. Execution Boundary and Stage 3B.2 Status

- **Stage 3B.1.6 Status:** COMPLETED AND VERIFIED. Test artifact isolation is fully hardened and verified.
- **Stage 3B.2 Status:** **STRICTLY UNAUTHORIZED.**
- **Boundaries Preserved:**
  - Zero models have been trained on Dataset A partitions under Stage 3B.
  - Zero records from the Test Vault (`ml_lab/splits/partition_assignments.csv` where `partition == "test"`, $N=4,186$) have been read, evaluated, or processed.
  - Dataset B remains completely quarantined under strict multi-layered isolation controls.
  - The historical production model (`models/best_model.pkl`) remains locked and protected.

---

### Audit Sign-off

- **Audit Lead:** Antigravity Autonomous Research Orchestrator  
- **Infrastructure Status:** 100% Isolated, Reproducible, and Hardened  
- **Test Suite Status:** 126/126 Unit Tests Passing, Zero Regressions, Zero Pollution  
- **Action Required:** Await explicit user authorization before initiating Stage 3B.2.
