"""
ml_lab/tests/test_pre_ingestion_isolation.py
Automated Verification Suite for Hardened Pre-Ingestion Test Vault Isolation.

Verifies:
  1. Development records are loaded correctly while Test Vault records are bypassed at I/O level.
  2. Test Vault feature and target values never enter the resulting DataFrame or memory.
  3. Original record order and feature-to-target alignment are strictly preserved.
  4. RFC 4180 parsing semantics: quoted delimiters, escaped quotes, multiline fields.
  5. Fail-closed gates: missing/duplicate positions, hash mismatches, row count mismatches, invalid schema.
  6. Field-parser instrumentation: verifies zero field parser invocations on Test Vault rows.
  7. A Test Vault sentinel value cannot appear anywhere in the Development DataFrame.
"""

import os
import csv
import hashlib
import tempfile
import unittest
import numpy as np
import pandas as pd

from ml_lab.evaluation.development_only_loader import (
    verify_file_hash,
    read_partition_membership,
    stream_development_records,
    load_development_dataset,
    load_development_dataframe_with_metadata,
    SecurityIntegrityError,
    PartitionLeakageError,
    PreIngestionIsolationError,
    FROZEN_NUMERICAL_FEATURES,
    FROZEN_CATEGORICAL_FEATURES,
    FROZEN_ALL_FEATURES,
    FROZEN_TARGET
)


class TestPreIngestionIsolation(unittest.TestCase):
    """Test suite verifying physical pre-ingestion isolation and RFC 4180 parsing semantics."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp_dir.cleanup()

    def _create_synthetic_fixtures(
        self,
        total_rows=10,
        dev_rows_count=6,
        include_multiline=True,
        include_escaped_quotes=True,
        include_quoted_delimiters=True,
        vault_sentinel="CRITICAL_VAULT_SENTINEL_TOKEN_XYZ_999"
    ):
        """Helper to create matching synthetic dataset and partition assignments files."""
        dataset_file = os.path.join(self.temp_dir.name, "synthetic_dataset.csv")
        assignments_file = os.path.join(self.temp_dir.name, "synthetic_assignments.csv")
        manifest_file = os.path.join(self.temp_dir.name, "synthetic_manifest.json")

        # Partition allocations: 6 dev, 4 test_vault
        # e.g. dev = [0, 2, 4, 6, 7, 9], test_vault = [1, 3, 5, 8]
        all_indices = list(range(total_rows))
        test_vault_count = total_rows - dev_rows_count
        test_indices = set(all_indices[1::2][:test_vault_count])
        dev_indices = [i for i in all_indices if i not in test_indices]

        # 1. Write assignments
        assignments_rows = []
        for idx in range(total_rows):
            part = "development" if idx in dev_indices else "test_vault"
            assignments_rows.append({
                "row_index": idx,
                "id": 1000 + idx,
                "group_id": f"group_{idx % 5}",
                "partition": part
            })
        assignments_df = pd.DataFrame(assignments_rows)
        assignments_df.to_csv(assignments_file, index=False)

        # 2. Write manifest
        with open(manifest_file, "w", encoding="utf-8") as f:
            f.write('{"manifest_version": "1.0", "description": "synthetic"}')

        # 3. Write dataset CSV
        header = ["id"] + FROZEN_ALL_FEATURES + [FROZEN_TARGET]
        records = []

        for idx in range(total_rows):
            is_dev = idx in dev_indices
            # If vault record, inject sentinel token
            city_val = f"City_{idx}" if is_dev else f"{vault_sentinel}_CITY_{idx}"
            gender_val = "Male" if idx % 2 == 0 else "Female"
            sleep_val = "7-8 hours"
            diet_val = "Moderate"
            degree_val = "B.Tech"

            if include_quoted_delimiters and idx == 0:
                # Quoted comma in development
                diet_val = "Moderate, Balanced, Organic"
            if include_multiline and idx == 1:
                # Multiline field in test vault record!
                sleep_val = f"Line1_{vault_sentinel}\nLine2_Continuation"
            if include_escaped_quotes and idx == 2:
                # Escaped quote in development: DictWriter will escape " to ""
                diet_val = 'Diet with "special" restrictions'
            if include_escaped_quotes and idx == 3:
                # Escaped quote in test vault
                degree_val = f'B.Sc with "{vault_sentinel}" honors'

            record = {
                "id": str(1000 + idx),
                "Age": str(20.0 + idx),
                "Academic Pressure": str(3.0),
                "CGPA": str(8.5),
                "Study Satisfaction": str(4.0),
                "Work/Study Hours": str(2.0),
                "Financial Stress": str(1.0),
                "Gender": gender_val,
                "Sleep Duration": sleep_val,
                "Dietary Habits": diet_val,
                "Degree": degree_val,
                "Depression": "1" if idx % 2 == 1 else "0"
            }
            records.append(record)

        with open(dataset_file, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=header)
            writer.writeheader()
            for r in records:
                writer.writerow(r)

        return dataset_file, assignments_file, manifest_file, dev_indices, test_indices, vault_sentinel

    def test_01_synthetic_development_loading_and_field_parser_bypass(self):
        """1. Verify that Development rows are loaded and Test Vault rows completely bypass the CSV field parser."""
        dataset_file, assignments_file, manifest_file, dev_indices, test_indices, vault_sentinel = (
            self._create_synthetic_fixtures(total_rows=10, dev_rows_count=6)
        )

        membership = read_partition_membership(
            assignments_path=assignments_file,
            manifest_path=manifest_file,
            expected_assignments_sha=None,
            expected_manifest_sha=None,
            expected_total_rows=10,
            expected_dev_rows=6,
            expected_test_vault_rows=4
        )

        header, dev_records, instrumentation = stream_development_records(
            dataset_path=dataset_file,
            dev_row_indices_set=membership["dev_row_indices_set"],
            expected_total_rows=10
        )

        # Assert correct record extraction
        self.assertEqual(len(dev_records), 6)
        self.assertEqual(instrumentation["total_records_seen"], 10)
        self.assertEqual(instrumentation["dev_records_parsed"], 6)
        self.assertEqual(instrumentation["test_vault_records_skipped"], 4)
        # Exactly 1 header call + 6 dev row calls = 7 field parser calls
        self.assertEqual(instrumentation["field_parser_calls"], 7)
        self.assertEqual(instrumentation["skipped_parser_bypasses"], 4)

    def test_02_sentinel_token_never_enters_dataframe_or_memory(self):
        """2. Verify that Test Vault sentinel values NEVER appear in the resulting Development DataFrame."""
        dataset_file, assignments_file, manifest_file, dev_indices, test_indices, vault_sentinel = (
            self._create_synthetic_fixtures(total_rows=10, dev_rows_count=6)
        )

        membership = read_partition_membership(
            assignments_path=assignments_file,
            manifest_path=manifest_file,
            expected_assignments_sha=None,
            expected_manifest_sha=None,
            expected_total_rows=10,
            expected_dev_rows=6,
            expected_test_vault_rows=4
        )

        header, dev_records, _ = stream_development_records(
            dataset_path=dataset_file,
            dev_row_indices_set=membership["dev_row_indices_set"],
            expected_total_rows=10
        )

        dev_df = pd.DataFrame(dev_records, columns=header, index=membership["dev_row_indices"])

        # Thorough scan of every cell in the resulting DataFrame
        for col in dev_df.columns:
            for val in dev_df[col].astype(str):
                self.assertNotIn(
                    vault_sentinel,
                    val,
                    f"CRITICAL LEAKAGE DETECTED: Sentinel token '{vault_sentinel}' was found in Development DataFrame col '{col}'!"
                )

    def test_03_original_order_and_alignment_preserved(self):
        """3. Verify that original record ordering and feature-to-target alignment are strictly preserved."""
        dataset_file, assignments_file, manifest_file, dev_indices, test_indices, _ = (
            self._create_synthetic_fixtures(total_rows=10, dev_rows_count=6)
        )

        membership = read_partition_membership(
            assignments_path=assignments_file,
            manifest_path=manifest_file,
            expected_assignments_sha=None,
            expected_manifest_sha=None,
            expected_total_rows=10,
            expected_dev_rows=6,
            expected_test_vault_rows=4
        )

        header, dev_records, _ = stream_development_records(
            dataset_path=dataset_file,
            dev_row_indices_set=membership["dev_row_indices_set"],
            expected_total_rows=10
        )

        dev_df = pd.DataFrame(dev_records, columns=header, index=membership["dev_row_indices"])

        # Check index ordering matches dev_indices exactly
        self.assertEqual(list(dev_df.index), dev_indices)

        # Check target alignment: in synthetic data, y = 1 if idx % 2 == 1 else 0
        expected_y = [1 if idx % 2 == 1 else 0 for idx in dev_indices]
        actual_y = dev_df[FROZEN_TARGET].astype(int).tolist()
        self.assertEqual(actual_y, expected_y)

        # Check Age feature alignment: Age = 20.0 + idx
        expected_age = [20.0 + idx for idx in dev_indices]
        actual_age = dev_df["Age"].astype(float).tolist()
        self.assertEqual(actual_age, expected_age)

    def test_04_quoted_delimiters_and_escaped_quotes_handled_correctly(self):
        """4. Verify RFC 4180 quoted delimiters and escaped quotes are parsed accurately."""
        dataset_file, assignments_file, manifest_file, dev_indices, test_indices, _ = (
            self._create_synthetic_fixtures(
                total_rows=10,
                dev_rows_count=6,
                include_quoted_delimiters=True,
                include_escaped_quotes=True
            )
        )

        membership = read_partition_membership(
            assignments_path=assignments_file,
            manifest_path=manifest_file,
            expected_assignments_sha=None,
            expected_manifest_sha=None,
            expected_total_rows=10,
            expected_dev_rows=6,
            expected_test_vault_rows=4
        )

        header, dev_records, _ = stream_development_records(
            dataset_path=dataset_file,
            dev_row_indices_set=membership["dev_row_indices_set"],
            expected_total_rows=10
        )

        dev_df = pd.DataFrame(dev_records, columns=header, index=membership["dev_row_indices"])

        # Row 0 had quoted commas: "Moderate, Balanced, Organic"
        self.assertEqual(dev_df.loc[0, "Dietary Habits"], "Moderate, Balanced, Organic")

        # Row 2 had escaped quotes: 'Diet with ""special"" restrictions' -> 'Diet with "special" restrictions'
        self.assertEqual(dev_df.loc[2, "Dietary Habits"], 'Diet with "special" restrictions')

    def test_05_multiline_fields_in_vault_records_bypassed_without_breaking_alignment(self):
        """5. Verify that multiline quoted records in Test Vault are correctly bypassed without desynchronizing record indices."""
        dataset_file, assignments_file, manifest_file, dev_indices, test_indices, vault_sentinel = (
            self._create_synthetic_fixtures(
                total_rows=10,
                dev_rows_count=6,
                include_multiline=True
            )
        )

        # Row 1 is in Test Vault and contains a multiline newline (\n) inside quotes
        membership = read_partition_membership(
            assignments_path=assignments_file,
            manifest_path=manifest_file,
            expected_assignments_sha=None,
            expected_manifest_sha=None,
            expected_total_rows=10,
            expected_dev_rows=6,
            expected_test_vault_rows=4
        )

        header, dev_records, instrumentation = stream_development_records(
            dataset_path=dataset_file,
            dev_row_indices_set=membership["dev_row_indices_set"],
            expected_total_rows=10
        )

        # Exactly 10 logical records tracked, even though physical line count is 11!
        self.assertEqual(instrumentation["total_records_seen"], 10)
        self.assertEqual(instrumentation["dev_records_parsed"], 6)
        self.assertEqual(instrumentation["test_vault_records_skipped"], 4)

        dev_df = pd.DataFrame(dev_records, columns=header, index=membership["dev_row_indices"])
        # Row 2 immediately following the multiline vault row must have correct Age and index
        self.assertEqual(dev_df.loc[2, "Age"], "22.0")

    def test_06_unclosed_quotes_fail_closed(self):
        """6. Verify that malformed CSV with unclosed quotes fails closed with SecurityIntegrityError."""
        malformed_csv = os.path.join(self.temp_dir.name, "malformed.csv")
        with open(malformed_csv, "w", encoding="utf-8") as f:
            f.write("id,Age,Depression\n1,20,\"unclosed quote\n2,21,1\n")

        with self.assertRaises(SecurityIntegrityError) as cm:
            stream_development_records(
                dataset_path=malformed_csv,
                dev_row_indices_set={0, 1},
                expected_total_rows=2
            )
        self.assertIn("Unclosed quotation mark", str(cm.exception))

    def test_07_unexpected_total_record_count_fails_closed(self):
        """7. Verify that row count discrepancies fail closed."""
        dataset_file, assignments_file, manifest_file, dev_indices, test_indices, _ = (
            self._create_synthetic_fixtures(total_rows=10, dev_rows_count=6)
        )

        membership = read_partition_membership(
            assignments_path=assignments_file,
            manifest_path=manifest_file,
            expected_assignments_sha=None,
            expected_manifest_sha=None,
            expected_total_rows=10,
            expected_dev_rows=6,
            expected_test_vault_rows=4
        )

        # Expecting 15 rows but dataset only has 10
        with self.assertRaises(SecurityIntegrityError) as cm:
            stream_development_records(
                dataset_path=dataset_file,
                dev_row_indices_set=membership["dev_row_indices_set"],
                expected_total_rows=15
            )
        self.assertIn("Dataset record count mismatch", str(cm.exception))

    def test_08_duplicate_or_missing_partition_positions_fail_closed(self):
        """8. Verify that duplicate, missing, or non-contiguous row_index values in assignments fail closed."""
        assignments_corrupt = os.path.join(self.temp_dir.name, "corrupt_assignments.csv")
        # Duplicate row_index 0, missing row_index 1
        df = pd.DataFrame({
            "row_index": [0, 0, 2],
            "id": [100, 101, 102],
            "group_id": ["g0", "g1", "g2"],
            "partition": ["development", "development", "test_vault"]
        })
        df.to_csv(assignments_corrupt, index=False)

        with self.assertRaises(SecurityIntegrityError) as cm:
            read_partition_membership(
                assignments_path=assignments_corrupt,
                expected_assignments_sha=None,
                expected_total_rows=3,
                expected_dev_rows=2,
                expected_test_vault_rows=1
            )
        self.assertIn("duplicate row indices", str(cm.exception))

    def test_09_hash_mismatch_fails_closed(self):
        """9. Verify cryptographic hash verification fails closed."""
        dummy_file = os.path.join(self.temp_dir.name, "dummy.txt")
        with open(dummy_file, "w") as f:
            f.write("content")

        with self.assertRaises(SecurityIntegrityError) as cm:
            verify_file_hash(dummy_file, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
        self.assertIn("Cryptographic hash mismatch", str(cm.exception))

    def test_10_missing_feature_or_target_schema_fails_closed(self):
        """10. Verify that dataset missing frozen features fails closed."""
        dataset_missing = os.path.join(self.temp_dir.name, "missing_feat.csv")
        with open(dataset_missing, "w", encoding="utf-8") as f:
            f.write("id,Age\n1,20\n")

        assignments_file = os.path.join(self.temp_dir.name, "assign.csv")
        df = pd.DataFrame({
            "row_index": [0],
            "id": [1],
            "group_id": ["g0"],
            "partition": ["development"]
        })
        df.to_csv(assignments_file, index=False)

        # Calling load_development_dataset with missing features
        with self.assertRaises(SecurityIntegrityError) as cm:
            # Bypass sha checks to test schema check
            load_development_dataset(
                dataset_path=dataset_missing,
                assignments_path=assignments_file,
                verify_hashes=False,
                expected_total_rows=1,
                expected_dev_rows=1,
                expected_test_vault_rows=0
            )
        self.assertIn("missing required model features", str(cm.exception).lower())


if __name__ == "__main__":
    unittest.main()
