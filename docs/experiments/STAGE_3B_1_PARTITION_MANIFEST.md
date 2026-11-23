# MINDORA 2.0 — STAGE 3B.1: GROUP-AWARE PARTITION MANIFEST & INTEGRITY REPORT

**Document Ref:** `docs/experiments/STAGE_3B_1_PARTITION_MANIFEST.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1 Group-Aware Partition Manifest Generation  
**Status:** Generated & Verified — **Final Test Vault Formally Governance-Locked**  

---

## 1. OBJECTIVE & COMPLIANCE SUMMARY

In strict adherence to the protocol approved in `docs/experiments/STAGE_3A_2_GROUP_VALIDATION_PROTOCOL.md` and signed off in `docs/experiments/STAGE_3A_4_FINAL_SIGNOFF.md`, the authoritative Group-Aware Partition Manifest has been generated from Dataset A (`dataset/Student_Depression_Dataset.csv`).

### Non-Negotiable Boundary Compliance:
1. **Dataset A Exclusivity:** Generated strictly from Dataset A ($27,901$ rows). Dataset B remains quarantined.
2. **Feature Signature Integrity:** Group IDs were constructed using full 64-character SHA-256 digests across the 10 approved model features. The target column `Depression` and ID columns were strictly excluded from signature generation.
3. **Zero Cross-Partition Group Leakage:** Verified that zero feature groups are shared between the Development partition and the Test Vault ($0$ group intersection).
4. **Duplicate Group Preservation:** Both known duplicate groups remained intact without fracturing across partitions:
   - Group 1 (Rows 902 and 8257, conflicting labels): Allocated entirely to the **Development partition**.
   - Group 2 (Rows 1818 and 11156, concordant labels): Allocated entirely to the **Test Vault**.
5. **Exact Row Accountability:** Every single row ($27,901/27,901$) is assigned to exactly one partition.
6. **Bounded Partition-Generation Exception:** Processing full Dataset A was authorized strictly for signature generation, group assignment, and aggregate verification during Stage 3B.1. Immediately upon generation, the Test Vault became governance-locked against all development activities (Stages 3B.1.1 through 3B.5); individual test record inspection and test metric computation are deferred strictly to Stage 3B.6.

---

## 2. PARTITION CONFIGURATION & METHODOLOGY

```
┌───────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Configuration Parameter               │ Approved Specification                                  │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Dataset File                          │ dataset/Student_Depression_Dataset.csv                  │
│ Dataset Cryptographic Hash            │ A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404│
│ Total Dataset Rows                    │ 27,901 rows                                             │
│ Total Unique Feature Groups           │ 27,899 groups (27,897 singletons, 2 duplicate pairs)     │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Partitioning Algorithm                │ sklearn.model_selection.StratifiedGroupKFold            │
│ Number of Folds (n_splits)            │ 20 folds                                                │
│ Shuffle Flag                          │ True                                                    │
│ Random Seed                           │ 42 (Master pinned seed)                                 │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Test Vault Fold Slices                │ Folds 0, 1, 2 (3/20 = 15.0%)                            │
│ Development Partition Fold Slices     │ Folds 3 through 19 (17/20 = 85.0%)                      │
└───────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 3. PARTITION STATISTICS & DISTRIBUTIONS

```
┌───────────────────────────────────────┬─────────────────────────────────────┬───────────────────────────────────────────┐
│ Metric / Property                     │ Development Partition               │ Final Test Vault (GOVERNANCE-LOCKED)      │
├───────────────────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────────┤
│ Status                                │ ACTIVE FOR DEV (Stages 3B.1–3B.5)   │ GOVERNANCE-LOCKED (Stage 3B.6 access only)│
│ Total Row Count                       │ 23,716 rows                         │ 4,185 rows                                │
│ Row Percentage of Dataset A           │ 85.001%                             │ 14.999%                                   │
│ Unique Feature Group Count            │ 23,715 groups                       │ 4,184 groups                              │
│ Singleton Groups (Size 1)             │ 23,714 groups                       │ 4,183 groups                              │
│ Multi-Row Groups (Size 2)             │ 1 group (Group 1)                   │ 1 group (Group 2)                         │
├───────────────────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────────┤
│ Depressed Cases (Target = 1)          │ 13,885 rows                         │ 2,451 rows                                │
│ Non-Depressed Cases (Target = 0)      │ 9,831 rows                          │ 1,734 rows                                │
│ Positive Class Prevalence             │ 0.5855 (58.55%)                     │ 0.5857 (58.57%)                           │
│ Imbalance Ratio (Class 1 : Class 0)   │ 1.412 : 1.000                       │ 1.413 : 1.000                             │
├───────────────────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────────┤
│ Duplicate Group 1 Allocation          │ Both Rows (902 & 8257)              │ None                                      │
│ Duplicate Group 2 Allocation          │ None                                │ Both Rows (1818 & 11156)                  │
└───────────────────────────────────────┴─────────────────────────────────────┴───────────────────────────────────────────┘
```

### Key Statistical Observations:
1. **Class Balance Stability:** The positive class prevalence is virtually identical between Development ($58.55\%$) and Test Vault ($58.57\%$), reflecting optimal stratified group allocation.
2. **Cluster Sparsity:** In the Test Vault, $4,183$ of the $4,184$ groups ($99.98\%$) are singletons, with exactly one 2-row group (Group 2).
3. **Inconsistent Label Allocation:** Group 1 (the inconsistent-label group where Row 902 is $y=1$ and Row 8257 is $y=0$) resides entirely in Development. The Test Vault contains zero conflicting labels.

---

## 4. INTEGRITY ASSERTIONS & LEAKAGE VERIFICATION

The partition manifest was audited against strict programmatic assertions:
- **Completeness Assertion:** $N_{\text{dev}} + N_{\text{test}} = 23,716 + 4,185 = 27,901 = N_{\text{total}}$ **[PASS]**.
- **Row Disjointness Assertion:** $\text{Indices}_{\text{dev}} \cap \text{Indices}_{\text{test}} = \emptyset$ (0 intersecting rows) **[PASS]**.
- **Group Disjointness Assertion:** $\text{Groups}_{\text{dev}} \cap \text{Groups}_{\text{test}} = \emptyset$ (0 intersecting groups) **[PASS]**.
- **Group 1 Containment Assertion:** $\text{Partition}(\text{Row } 902) = \text{Partition}(\text{Row } 8257) = \text{"development"}$ **[PASS]**.
- **Group 2 Containment Assertion:** $\text{Partition}(\text{Row } 1818) = \text{Partition}(\text{Row } 11156) = \text{"test\_vault"}$ **[PASS]**.

---

## 5. GENERATED FILE ARTIFACTS & CRYPTOGRAPHIC CHECKSUMS

The partition manifest and assignment mappings have been generated and serialized into `ml_lab/splits/`:

```
┌───────────────────────────────────────────────────┬──────────────┬──────────────────────────────────────────────────────────────────┐
│ File Path                                         │ File Size    │ SHA-256 Cryptographic Checksum                                   │
├───────────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────┤
│ ml_lab/splits/partition_assignments.csv           │ ~2.46 MB     │ 91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1│
│ ml_lab/splits/group_aware_partition_manifest.json │ ~3.82 KB     │ A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070│
└───────────────────────────────────────────────────┴──────────────┴──────────────────────────────────────────────────────────────────┘
```

### File Schemas:
1. `ml_lab/splits/partition_assignments.csv`:
   - Columns: `row_index` (int, 0–27900), `id` (int, original dataset ID), `group_id` (str, 64-char hex SHA-256), `partition` (str, `development` or `test_vault`), `fold_20` (int, 0–19).
2. `ml_lab/splits/group_aware_partition_manifest.json`:
   - Contains complete machine-readable audit metadata, dataset provenance, fold configuration, class distributions, integrity flags, and file checksums.

---

**MANIFEST VERIFICATION SIGN-OFF:** The Group-Aware Partition Manifest is certified bit-exact, leak-free, and governance-locked.
