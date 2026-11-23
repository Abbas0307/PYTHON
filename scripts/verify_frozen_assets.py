import os
import sys
import hashlib

frozen_assets = [
    'app.py',
    'dataset/Student_Depression_Dataset.csv',
    'shared/contracts/feature_contract.json',
    'ml_lab/splits/group_aware_partition_manifest.json',
    'ml_lab/splits/partition_assignments.csv',
    'models/best_model.pkl',
    'ml_lab/experiments/stage_3b_2/oof_metrics.json',
    'ml_lab/experiments/stage_3b_3/oof_metrics.json',
    'ml_lab/experiments/stage_3b_3/model_comparison.json',
    'ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json',
    'ml_lab/experiments/stage_3b_4/artifact_manifest.json'
]

baselines = {
    'app.py': '5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE',
    'dataset/Student_Depression_Dataset.csv': 'A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404',
    'shared/contracts/feature_contract.json': 'BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0',
    'ml_lab/splits/group_aware_partition_manifest.json': 'A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070',
    'ml_lab/splits/partition_assignments.csv': '91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1',
    'models/best_model.pkl': 'E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC',
    'ml_lab/experiments/stage_3b_2/oof_metrics.json': '361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF',
    'ml_lab/experiments/stage_3b_3/oof_metrics.json': '555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03',
    'ml_lab/experiments/stage_3b_3/model_comparison.json': 'FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7',
    'ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json': 'FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6',
    'ml_lab/experiments/stage_3b_4/artifact_manifest.json': 'B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072'
}

print(f"{'Asset File':<55} | {'Baseline SHA-256':<64} | {'Actual Computed SHA-256':<64} | {'Status'}")
print("-" * 195)

all_matched = True
for asset in frozen_assets:
    if not os.path.exists(asset):
        print(f"{asset:<55} | FILE NOT FOUND | FILE NOT FOUND | MISSING")
        all_matched = False
        continue
    with open(asset, 'rb') as f:
        actual = hashlib.sha256(f.read()).hexdigest().upper()
    expected = baselines[asset]
    status = 'MATCH' if actual == expected else 'MISMATCH'
    if status != 'MATCH':
        all_matched = False
    print(f"{asset:<55} | {expected:<64} | {actual:<64} | {status}")

print("=" * 195)
print(f"Verification result: {'11/11 EXACT MATCHES (100% SUCCESS)' if all_matched else 'INTEGRITY VIOLATION DETECTED'}")
