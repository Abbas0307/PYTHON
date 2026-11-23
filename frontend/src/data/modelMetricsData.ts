/**
 * frontend/src/data/modelMetricsData.ts
 * Pre-compiled experimental metrics for the 4 ML models on both Track A (Large Dataset)
 * and Track B (163-Record Dataset).
 * Generated automatically from verified offline evaluation pipelines.
 */

export const LARGE_DATASET_METRICS = {
  "dataset": "Large Public Benchmark (dataset/Student_Depression_Dataset.csv)",
  "dataset_provenance": "Verified Kaggle Student Depression Benchmark (Frozen SHA-256 A3E159...)",
  "total_records": 27901,
  "feature_count": 45,
  "sample_counts": {
    "train": 19530,
    "val": 4185,
    "test": 4186
  },
  "positive_class": "1 (Depressed)",
  "timestamp": "2026-11-16T18:30:00Z",
  "models": {
    "Logistic Regression": {
      "name": "Logistic Regression",
      "description": "L2-regularized linear model with balanced class weighting and standardized features.",
      "hyperparameters": {
        "C": 1.0,
        "penalty": "l2",
        "solver": "lbfgs",
        "class_weight": "balanced",
        "max_iter": 1500
      },
      "training_duration_seconds": 0.031,
      "train_metrics": {
        "accuracy": 0.7953,
        "precision": 0.8462,
        "recall": 0.7949,
        "specificity": 0.7959,
        "sensitivity": 0.7949,
        "f1_score": 0.8198,
        "macro_f1": 0.7915,
        "roc_auc": 0.8734,
        "pr_auc": 0.9011,
        "brier_score": 0.1439,
        "inference_time_ms_per_sample": 0.0,
        "confusion_matrix": [
          [
            6443,
            1652
          ],
          [
            2345,
            9090
          ]
        ],
        "breakdown": {
          "tn": 6443,
          "fp": 1652,
          "fn": 2345,
          "tp": 9090
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7331588529813382,
            "recall": 0.7959234095120444,
            "f1-score": 0.7632529763667595,
            "support": 8095.0
          },
          "Depressed": {
            "precision": 0.8462111338670638,
            "recall": 0.794927853082641,
            "f1-score": 0.8197682283446814,
            "support": 11435.0
          },
          "accuracy": 0.7953405017921147,
          "macro avg": {
            "precision": 0.789684993424201,
            "recall": 0.7954256312973427,
            "f1-score": 0.7915106023557205,
            "support": 19530.0
          },
          "weighted avg": {
            "precision": 0.7993520343396727,
            "recall": 0.7953405017921147,
            "f1-score": 0.7963431917465617,
            "support": 19530.0
          }
        }
      },
      "validation_metrics": {
        "accuracy": 0.7921,
        "precision": 0.8408,
        "recall": 0.7955,
        "specificity": 0.7873,
        "sensitivity": 0.7955,
        "f1_score": 0.8175,
        "macro_f1": 0.788,
        "roc_auc": 0.8711,
        "pr_auc": 0.8955,
        "brier_score": 0.1451,
        "inference_time_ms_per_sample": 0.0001,
        "confusion_matrix": [
          [
            1366,
            369
          ],
          [
            501,
            1949
          ]
        ],
        "breakdown": {
          "tn": 1366,
          "fp": 369,
          "fn": 501,
          "tp": 1949
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7316550615961436,
            "recall": 0.7873198847262248,
            "f1-score": 0.7584675180455303,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8408110440034513,
            "recall": 0.7955102040816326,
            "f1-score": 0.8175335570469798,
            "support": 2450.0
          },
          "accuracy": 0.7921146953405018,
          "macro avg": {
            "precision": 0.7862330527997974,
            "recall": 0.7914150444039287,
            "f1-score": 0.7880005375462551,
            "support": 4185.0
          },
          "weighted avg": {
            "precision": 0.7955576080472556,
            "recall": 0.7921146953405018,
            "f1-score": 0.7930462027656142,
            "support": 4185.0
          }
        }
      },
      "test_metrics": {
        "accuracy": 0.7898,
        "precision": 0.8393,
        "recall": 0.7927,
        "specificity": 0.7856,
        "sensitivity": 0.7927,
        "f1_score": 0.8154,
        "macro_f1": 0.7857,
        "roc_auc": 0.8663,
        "pr_auc": 0.8936,
        "brier_score": 0.1475,
        "inference_time_ms_per_sample": 0.0001,
        "confusion_matrix": [
          [
            1363,
            372
          ],
          [
            508,
            1943
          ]
        ],
        "breakdown": {
          "tn": 1363,
          "fp": 372,
          "fn": 508,
          "tp": 1943
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7284874398717264,
            "recall": 0.7855907780979827,
            "f1-score": 0.7559622850804215,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8393088552915767,
            "recall": 0.7927376580987352,
            "f1-score": 0.8153587914393622,
            "support": 2451.0
          },
          "accuracy": 0.789775441949355,
          "macro avg": {
            "precision": 0.7838981475816515,
            "recall": 0.7891642180983589,
            "f1-score": 0.7856605382598918,
            "support": 4186.0
          },
          "weighted avg": {
            "precision": 0.7933759466070472,
            "recall": 0.789775441949355,
            "f1-score": 0.7907403159179188,
            "support": 4186.0
          }
        }
      },
      "roc_curve": [
        {
          "fpr": 0.0,
          "tpr": 0.0
        },
        {
          "fpr": 0.0069,
          "tpr": 0.1428
        },
        {
          "fpr": 0.0144,
          "tpr": 0.2162
        },
        {
          "fpr": 0.0231,
          "tpr": 0.2844
        },
        {
          "fpr": 0.0311,
          "tpr": 0.3509
        },
        {
          "fpr": 0.0386,
          "tpr": 0.3978
        },
        {
          "fpr": 0.0467,
          "tpr": 0.4382
        },
        {
          "fpr": 0.0559,
          "tpr": 0.4598
        },
        {
          "fpr": 0.064,
          "tpr": 0.5088
        },
        {
          "fpr": 0.0744,
          "tpr": 0.5443
        },
        {
          "fpr": 0.0841,
          "tpr": 0.5659
        },
        {
          "fpr": 0.0928,
          "tpr": 0.5879
        },
        {
          "fpr": 0.1032,
          "tpr": 0.6157
        },
        {
          "fpr": 0.1112,
          "tpr": 0.6348
        },
        {
          "fpr": 0.1205,
          "tpr": 0.654
        },
        {
          "fpr": 0.1285,
          "tpr": 0.6667
        },
        {
          "fpr": 0.1378,
          "tpr": 0.6805
        },
        {
          "fpr": 0.1487,
          "tpr": 0.6887
        },
        {
          "fpr": 0.1579,
          "tpr": 0.7083
        },
        {
          "fpr": 0.1666,
          "tpr": 0.7226
        },
        {
          "fpr": 0.1775,
          "tpr": 0.7336
        },
        {
          "fpr": 0.1879,
          "tpr": 0.7515
        },
        {
          "fpr": 0.1965,
          "tpr": 0.7646
        },
        {
          "fpr": 0.2046,
          "tpr": 0.7789
        },
        {
          "fpr": 0.2144,
          "tpr": 0.7931
        },
        {
          "fpr": 0.2271,
          "tpr": 0.8078
        },
        {
          "fpr": 0.238,
          "tpr": 0.8172
        },
        {
          "fpr": 0.2478,
          "tpr": 0.829
        },
        {
          "fpr": 0.2617,
          "tpr": 0.8433
        },
        {
          "fpr": 0.2847,
          "tpr": 0.8519
        },
        {
          "fpr": 0.2997,
          "tpr": 0.8605
        },
        {
          "fpr": 0.3147,
          "tpr": 0.8735
        },
        {
          "fpr": 0.3314,
          "tpr": 0.8841
        },
        {
          "fpr": 0.3562,
          "tpr": 0.8935
        },
        {
          "fpr": 0.3712,
          "tpr": 0.9033
        },
        {
          "fpr": 0.389,
          "tpr": 0.9106
        },
        {
          "fpr": 0.4046,
          "tpr": 0.9184
        },
        {
          "fpr": 0.4265,
          "tpr": 0.9257
        },
        {
          "fpr": 0.4409,
          "tpr": 0.9327
        },
        {
          "fpr": 0.4663,
          "tpr": 0.9392
        },
        {
          "fpr": 0.4963,
          "tpr": 0.9457
        },
        {
          "fpr": 0.5233,
          "tpr": 0.9523
        },
        {
          "fpr": 0.5585,
          "tpr": 0.9588
        },
        {
          "fpr": 0.5862,
          "tpr": 0.9641
        },
        {
          "fpr": 0.6259,
          "tpr": 0.9702
        },
        {
          "fpr": 0.6697,
          "tpr": 0.9763
        },
        {
          "fpr": 0.721,
          "tpr": 0.9833
        },
        {
          "fpr": 0.8161,
          "tpr": 0.989
        },
        {
          "fpr": 0.8715,
          "tpr": 0.9947
        },
        {
          "fpr": 1.0,
          "tpr": 1.0
        }
      ],
      "pr_curve": [
        {
          "recall": 1.0,
          "precision": 0.5855
        },
        {
          "recall": 0.998,
          "precision": 0.5964
        },
        {
          "recall": 0.9963,
          "precision": 0.6081
        },
        {
          "recall": 0.9935,
          "precision": 0.6196
        },
        {
          "recall": 0.9894,
          "precision": 0.6307
        },
        {
          "recall": 0.9869,
          "precision": 0.6435
        },
        {
          "recall": 0.9841,
          "precision": 0.6565
        },
        {
          "recall": 0.978,
          "precision": 0.6681
        },
        {
          "recall": 0.9723,
          "precision": 0.6803
        },
        {
          "recall": 0.9661,
          "precision": 0.6928
        },
        {
          "recall": 0.9596,
          "precision": 0.7059
        },
        {
          "recall": 0.9527,
          "precision": 0.7191
        },
        {
          "recall": 0.9437,
          "precision": 0.7317
        },
        {
          "recall": 0.9355,
          "precision": 0.7454
        },
        {
          "recall": 0.9229,
          "precision": 0.7565
        },
        {
          "recall": 0.9106,
          "precision": 0.7683
        },
        {
          "recall": 0.896,
          "precision": 0.7787
        },
        {
          "recall": 0.8829,
          "precision": 0.7915
        },
        {
          "recall": 0.8637,
          "precision": 0.7992
        },
        {
          "recall": 0.8507,
          "precision": 0.8135
        },
        {
          "recall": 0.8327,
          "precision": 0.8236
        },
        {
          "recall": 0.8123,
          "precision": 0.8324
        },
        {
          "recall": 0.7899,
          "precision": 0.8392
        },
        {
          "recall": 0.7662,
          "precision": 0.8452
        },
        {
          "recall": 0.7421,
          "precision": 0.8516
        },
        {
          "recall": 0.7201,
          "precision": 0.8606
        },
        {
          "recall": 0.6952,
          "precision": 0.8672
        },
        {
          "recall": 0.6736,
          "precision": 0.8782
        },
        {
          "recall": 0.6483,
          "precision": 0.8857
        },
        {
          "recall": 0.6222,
          "precision": 0.8923
        },
        {
          "recall": 0.5949,
          "precision": 0.8978
        },
        {
          "recall": 0.5675,
          "precision": 0.9044
        },
        {
          "recall": 0.5414,
          "precision": 0.9133
        },
        {
          "recall": 0.5112,
          "precision": 0.9166
        },
        {
          "recall": 0.4806,
          "precision": 0.9189
        },
        {
          "recall": 0.4504,
          "precision": 0.9231
        },
        {
          "recall": 0.4235,
          "precision": 0.9343
        },
        {
          "recall": 0.3913,
          "precision": 0.9347
        },
        {
          "recall": 0.3607,
          "precision": 0.9404
        },
        {
          "recall": 0.3288,
          "precision": 0.9427
        },
        {
          "recall": 0.2966,
          "precision": 0.9454
        },
        {
          "recall": 0.264,
          "precision": 0.9459
        },
        {
          "recall": 0.2317,
          "precision": 0.9498
        },
        {
          "recall": 0.1995,
          "precision": 0.9532
        },
        {
          "recall": 0.1673,
          "precision": 0.9579
        },
        {
          "recall": 0.135,
          "precision": 0.9678
        },
        {
          "recall": 0.102,
          "precision": 0.9728
        },
        {
          "recall": 0.0685,
          "precision": 0.9825
        },
        {
          "recall": 0.0347,
          "precision": 0.9884
        },
        {
          "recall": 0.0,
          "precision": 1.0
        }
      ],
      "calibration_curve": [
        {
          "mean_predicted_value": 0.0545,
          "fraction_of_positives": 0.0858
        },
        {
          "mean_predicted_value": 0.1455,
          "fraction_of_positives": 0.1727
        },
        {
          "mean_predicted_value": 0.2466,
          "fraction_of_positives": 0.3211
        },
        {
          "mean_predicted_value": 0.3512,
          "fraction_of_positives": 0.4441
        },
        {
          "mean_predicted_value": 0.4486,
          "fraction_of_positives": 0.5461
        },
        {
          "mean_predicted_value": 0.5489,
          "fraction_of_positives": 0.6759
        },
        {
          "mean_predicted_value": 0.6495,
          "fraction_of_positives": 0.7022
        },
        {
          "mean_predicted_value": 0.7499,
          "fraction_of_positives": 0.8126
        },
        {
          "mean_predicted_value": 0.8551,
          "fraction_of_positives": 0.8836
        },
        {
          "mean_predicted_value": 0.946,
          "fraction_of_positives": 0.9465
        }
      ],
      "feature_importance": {
        "Academic Pressure": 1.1762,
        "Financial Stress": 0.8276,
        "Age": -0.5859,
        "Dietary Habits_Healthy": -0.5466,
        "Dietary Habits_Unhealthy": 0.5427,
        "Degree_ME": -0.4626,
        "Work/Study Hours": 0.443,
        "Sleep Duration_Less than 5 hours": 0.3831,
        "Study Satisfaction": -0.3053,
        "Sleep Duration_More than 8 hours": -0.2911,
        "Degree_Class 12": -0.2327,
        "Degree_B.Pharm": -0.2172,
        "Degree_LLB": 0.2053,
        "Degree_BSc": 0.1595,
        "Degree_LLM": 0.156
      },
      "model_path": "models/large_dataset\\logistic_regression.joblib"
    },
    "Random Forest": {
      "name": "Random Forest",
      "description": "Ensemble bagging decision trees with bounded tree depth to mitigate overfitting.",
      "hyperparameters": {
        "n_estimators": 150,
        "max_depth": 8,
        "min_samples_split": 5,
        "class_weight": "balanced"
      },
      "training_duration_seconds": 0.286,
      "train_metrics": {
        "accuracy": 0.8066,
        "precision": 0.8503,
        "recall": 0.8128,
        "specificity": 0.7979,
        "sensitivity": 0.8128,
        "f1_score": 0.8311,
        "macro_f1": 0.8024,
        "roc_auc": 0.8856,
        "pr_auc": 0.9101,
        "brier_score": 0.1516,
        "inference_time_ms_per_sample": 0.0021,
        "confusion_matrix": [
          [
            6459,
            1636
          ],
          [
            2141,
            9294
          ]
        ],
        "breakdown": {
          "tn": 6459,
          "fp": 1636,
          "fn": 2141,
          "tp": 9294
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.751046511627907,
            "recall": 0.7978999382334775,
            "f1-score": 0.7737646001796945,
            "support": 8095.0
          },
          "Depressed": {
            "precision": 0.85032021957914,
            "recall": 0.8127678181023175,
            "f1-score": 0.8311200536552649,
            "support": 11435.0
          },
          "accuracy": 0.806605222734255,
          "macro avg": {
            "precision": 0.8006833656035235,
            "recall": 0.8053338781678975,
            "f1-score": 0.8024423269174796,
            "support": 19530.0
          },
          "weighted avg": {
            "precision": 0.8091722080141,
            "recall": 0.806605222734255,
            "f1-score": 0.8073467614952679,
            "support": 19530.0
          }
        }
      },
      "validation_metrics": {
        "accuracy": 0.7902,
        "precision": 0.8342,
        "recall": 0.8008,
        "specificity": 0.7752,
        "sensitivity": 0.8008,
        "f1_score": 0.8172,
        "macro_f1": 0.7855,
        "roc_auc": 0.867,
        "pr_auc": 0.8945,
        "brier_score": 0.1586,
        "inference_time_ms_per_sample": 0.0088,
        "confusion_matrix": [
          [
            1345,
            390
          ],
          [
            488,
            1962
          ]
        ],
        "breakdown": {
          "tn": 1345,
          "fp": 390,
          "fn": 488,
          "tp": 1962
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7337697763229678,
            "recall": 0.7752161383285303,
            "f1-score": 0.7539237668161435,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8341836734693877,
            "recall": 0.8008163265306123,
            "f1-score": 0.8171595168679717,
            "support": 2450.0
          },
          "accuracy": 0.7902031063321386,
          "macro avg": {
            "precision": 0.7839767248961778,
            "recall": 0.7880162324295713,
            "f1-score": 0.7855416418420575,
            "support": 4185.0
          },
          "weighted avg": {
            "precision": 0.7925544950825206,
            "recall": 0.7902031063321386,
            "f1-score": 0.7909435010161385,
            "support": 4185.0
          }
        }
      },
      "test_metrics": {
        "accuracy": 0.7833,
        "precision": 0.8308,
        "recall": 0.7911,
        "specificity": 0.7723,
        "sensitivity": 0.7911,
        "f1_score": 0.8104,
        "macro_f1": 0.7788,
        "roc_auc": 0.8596,
        "pr_auc": 0.8859,
        "brier_score": 0.162,
        "inference_time_ms_per_sample": 0.009,
        "confusion_matrix": [
          [
            1340,
            395
          ],
          [
            512,
            1939
          ]
        ],
        "breakdown": {
          "tn": 1340,
          "fp": 395,
          "fn": 512,
          "tp": 1939
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7235421166306696,
            "recall": 0.7723342939481268,
            "f1-score": 0.7471424588792863,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8307626392459297,
            "recall": 0.7911056711546308,
            "f1-score": 0.8104493207941483,
            "support": 2451.0
          },
          "accuracy": 0.783325370281892,
          "macro avg": {
            "precision": 0.7771523779382996,
            "recall": 0.7817199825513788,
            "f1-score": 0.7787958898367173,
            "support": 4186.0
          },
          "weighted avg": {
            "precision": 0.7863222171872876,
            "recall": 0.783325370281892,
            "f1-score": 0.7842100935074103,
            "support": 4186.0
          }
        }
      },
      "roc_curve": [
        {
          "fpr": 0.0,
          "tpr": 0.0
        },
        {
          "fpr": 0.0069,
          "tpr": 0.1142
        },
        {
          "fpr": 0.015,
          "tpr": 0.2158
        },
        {
          "fpr": 0.0231,
          "tpr": 0.2562
        },
        {
          "fpr": 0.0317,
          "tpr": 0.3178
        },
        {
          "fpr": 0.0398,
          "tpr": 0.3594
        },
        {
          "fpr": 0.0484,
          "tpr": 0.4051
        },
        {
          "fpr": 0.0565,
          "tpr": 0.45
        },
        {
          "fpr": 0.0651,
          "tpr": 0.4704
        },
        {
          "fpr": 0.0761,
          "tpr": 0.5137
        },
        {
          "fpr": 0.0865,
          "tpr": 0.5475
        },
        {
          "fpr": 0.0963,
          "tpr": 0.5712
        },
        {
          "fpr": 0.1061,
          "tpr": 0.59
        },
        {
          "fpr": 0.1153,
          "tpr": 0.6144
        },
        {
          "fpr": 0.1256,
          "tpr": 0.6357
        },
        {
          "fpr": 0.1354,
          "tpr": 0.6573
        },
        {
          "fpr": 0.1441,
          "tpr": 0.6748
        },
        {
          "fpr": 0.1533,
          "tpr": 0.6858
        },
        {
          "fpr": 0.1648,
          "tpr": 0.7013
        },
        {
          "fpr": 0.1775,
          "tpr": 0.7177
        },
        {
          "fpr": 0.1867,
          "tpr": 0.7307
        },
        {
          "fpr": 0.1965,
          "tpr": 0.7519
        },
        {
          "fpr": 0.2104,
          "tpr": 0.765
        },
        {
          "fpr": 0.2225,
          "tpr": 0.7829
        },
        {
          "fpr": 0.234,
          "tpr": 0.7952
        },
        {
          "fpr": 0.245,
          "tpr": 0.8066
        },
        {
          "fpr": 0.2571,
          "tpr": 0.8148
        },
        {
          "fpr": 0.2703,
          "tpr": 0.8266
        },
        {
          "fpr": 0.2847,
          "tpr": 0.8417
        },
        {
          "fpr": 0.3003,
          "tpr": 0.8596
        },
        {
          "fpr": 0.3182,
          "tpr": 0.869
        },
        {
          "fpr": 0.3366,
          "tpr": 0.8776
        },
        {
          "fpr": 0.3481,
          "tpr": 0.889
        },
        {
          "fpr": 0.3585,
          "tpr": 0.8976
        },
        {
          "fpr": 0.3775,
          "tpr": 0.9082
        },
        {
          "fpr": 0.3919,
          "tpr": 0.9151
        },
        {
          "fpr": 0.4092,
          "tpr": 0.9221
        },
        {
          "fpr": 0.4334,
          "tpr": 0.9282
        },
        {
          "fpr": 0.445,
          "tpr": 0.9335
        },
        {
          "fpr": 0.4726,
          "tpr": 0.9392
        },
        {
          "fpr": 0.5084,
          "tpr": 0.9457
        },
        {
          "fpr": 0.5366,
          "tpr": 0.9539
        },
        {
          "fpr": 0.5677,
          "tpr": 0.9592
        },
        {
          "fpr": 0.5988,
          "tpr": 0.9661
        },
        {
          "fpr": 0.6421,
          "tpr": 0.9723
        },
        {
          "fpr": 0.6963,
          "tpr": 0.978
        },
        {
          "fpr": 0.7389,
          "tpr": 0.9833
        },
        {
          "fpr": 0.8236,
          "tpr": 0.989
        },
        {
          "fpr": 0.8945,
          "tpr": 0.9947
        },
        {
          "fpr": 1.0,
          "tpr": 1.0
        }
      ],
      "pr_curve": [
        {
          "recall": 1.0,
          "precision": 0.5855
        },
        {
          "recall": 1.0,
          "precision": 0.5977
        },
        {
          "recall": 0.9963,
          "precision": 0.6081
        },
        {
          "recall": 0.9927,
          "precision": 0.6191
        },
        {
          "recall": 0.989,
          "precision": 0.6304
        },
        {
          "recall": 0.9865,
          "precision": 0.6433
        },
        {
          "recall": 0.9829,
          "precision": 0.6557
        },
        {
          "recall": 0.9776,
          "precision": 0.6676
        },
        {
          "recall": 0.9731,
          "precision": 0.6808
        },
        {
          "recall": 0.9674,
          "precision": 0.6937
        },
        {
          "recall": 0.9588,
          "precision": 0.7053
        },
        {
          "recall": 0.9523,
          "precision": 0.7188
        },
        {
          "recall": 0.9433,
          "precision": 0.7312
        },
        {
          "recall": 0.9359,
          "precision": 0.7458
        },
        {
          "recall": 0.9257,
          "precision": 0.7586
        },
        {
          "recall": 0.9119,
          "precision": 0.7694
        },
        {
          "recall": 0.8972,
          "precision": 0.7798
        },
        {
          "recall": 0.8776,
          "precision": 0.7865
        },
        {
          "recall": 0.8637,
          "precision": 0.7992
        },
        {
          "recall": 0.8441,
          "precision": 0.8069
        },
        {
          "recall": 0.8233,
          "precision": 0.8144
        },
        {
          "recall": 0.805,
          "precision": 0.8245
        },
        {
          "recall": 0.7834,
          "precision": 0.8319
        },
        {
          "recall": 0.7609,
          "precision": 0.8393
        },
        {
          "recall": 0.7373,
          "precision": 0.8456
        },
        {
          "recall": 0.7132,
          "precision": 0.8523
        },
        {
          "recall": 0.6932,
          "precision": 0.8642
        },
        {
          "recall": 0.6671,
          "precision": 0.8697
        },
        {
          "recall": 0.641,
          "precision": 0.8752
        },
        {
          "recall": 0.6157,
          "precision": 0.8825
        },
        {
          "recall": 0.5883,
          "precision": 0.8879
        },
        {
          "recall": 0.5622,
          "precision": 0.8954
        },
        {
          "recall": 0.5349,
          "precision": 0.9023
        },
        {
          "recall": 0.5063,
          "precision": 0.9072
        },
        {
          "recall": 0.4757,
          "precision": 0.9088
        },
        {
          "recall": 0.4492,
          "precision": 0.9198
        },
        {
          "recall": 0.4166,
          "precision": 0.919
        },
        {
          "recall": 0.3872,
          "precision": 0.9259
        },
        {
          "recall": 0.3562,
          "precision": 0.9287
        },
        {
          "recall": 0.3252,
          "precision": 0.9322
        },
        {
          "recall": 0.2933,
          "precision": 0.935
        },
        {
          "recall": 0.2627,
          "precision": 0.9415
        },
        {
          "recall": 0.2309,
          "precision": 0.9465
        },
        {
          "recall": 0.2003,
          "precision": 0.9571
        },
        {
          "recall": 0.1669,
          "precision": 0.9556
        },
        {
          "recall": 0.1338,
          "precision": 0.9591
        },
        {
          "recall": 0.1012,
          "precision": 0.965
        },
        {
          "recall": 0.0673,
          "precision": 0.9649
        },
        {
          "recall": 0.0347,
          "precision": 0.9884
        },
        {
          "recall": 0.0,
          "precision": 1.0
        }
      ],
      "calibration_curve": [
        {
          "mean_predicted_value": 0.0916,
          "fraction_of_positives": 0.0
        },
        {
          "mean_predicted_value": 0.1626,
          "fraction_of_positives": 0.0769
        },
        {
          "mean_predicted_value": 0.2474,
          "fraction_of_positives": 0.1387
        },
        {
          "mean_predicted_value": 0.3487,
          "fraction_of_positives": 0.2696
        },
        {
          "mean_predicted_value": 0.45,
          "fraction_of_positives": 0.5377
        },
        {
          "mean_predicted_value": 0.5524,
          "fraction_of_positives": 0.6796
        },
        {
          "mean_predicted_value": 0.6511,
          "fraction_of_positives": 0.8116
        },
        {
          "mean_predicted_value": 0.7508,
          "fraction_of_positives": 0.9016
        },
        {
          "mean_predicted_value": 0.8345,
          "fraction_of_positives": 0.9548
        },
        {
          "mean_predicted_value": 0.906,
          "fraction_of_positives": 1.0
        }
      ],
      "feature_importance": {
        "Academic Pressure": 0.3996,
        "Financial Stress": 0.2178,
        "Age": 0.0905,
        "Work/Study Hours": 0.073,
        "Dietary Habits_Unhealthy": 0.0508,
        "Study Satisfaction": 0.0419,
        "Dietary Habits_Healthy": 0.0308,
        "CGPA": 0.0186,
        "Degree_Class 12": 0.0166,
        "Sleep Duration_Less than 5 hours": 0.0089,
        "Sleep Duration_More than 8 hours": 0.0087,
        "Dietary Habits_Moderate": 0.0071,
        "Gender_Male": 0.0026,
        "Sleep Duration_5-6 hours": 0.0025,
        "Gender_Female": 0.0024
      },
      "model_path": "models/large_dataset\\random_forest.joblib"
    },
    "XGBoost": {
      "name": "XGBoost",
      "description": "Gradient boosted decision trees optimized with shrinkage and regularized objective.",
      "hyperparameters": {
        "n_estimators": 150,
        "max_depth": 5,
        "learning_rate": 0.05,
        "subsample": 0.85,
        "colsample_bytree": 0.85
      },
      "training_duration_seconds": 0.222,
      "train_metrics": {
        "accuracy": 0.8179,
        "precision": 0.8308,
        "recall": 0.8652,
        "specificity": 0.7511,
        "sensitivity": 0.8652,
        "f1_score": 0.8476,
        "macro_f1": 0.8107,
        "roc_auc": 0.895,
        "pr_auc": 0.9199,
        "brier_score": 0.1283,
        "inference_time_ms_per_sample": 0.0003,
        "confusion_matrix": [
          [
            6080,
            2015
          ],
          [
            1542,
            9893
          ]
        ],
        "breakdown": {
          "tn": 6080,
          "fp": 2015,
          "fn": 1542,
          "tp": 9893
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7976908947782734,
            "recall": 0.7510809141445337,
            "f1-score": 0.7736845453967042,
            "support": 8095.0
          },
          "Depressed": {
            "precision": 0.8307860262008734,
            "recall": 0.8651508526453869,
            "f1-score": 0.847620271601765,
            "support": 11435.0
          },
          "accuracy": 0.8178699436763953,
          "macro avg": {
            "precision": 0.8142384604895734,
            "recall": 0.8081158833949603,
            "f1-score": 0.8106524084992346,
            "support": 19530.0
          },
          "weighted avg": {
            "precision": 0.8170684077233544,
            "recall": 0.8178699436763953,
            "f1-score": 0.8169746134537892,
            "support": 19530.0
          }
        }
      },
      "validation_metrics": {
        "accuracy": 0.7988,
        "precision": 0.8141,
        "recall": 0.8506,
        "specificity": 0.7256,
        "sensitivity": 0.8506,
        "f1_score": 0.8319,
        "macro_f1": 0.7907,
        "roc_auc": 0.8722,
        "pr_auc": 0.8979,
        "brier_score": 0.141,
        "inference_time_ms_per_sample": 0.0003,
        "confusion_matrix": [
          [
            1259,
            476
          ],
          [
            366,
            2084
          ]
        ],
        "breakdown": {
          "tn": 1259,
          "fp": 476,
          "fn": 366,
          "tp": 2084
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7747692307692308,
            "recall": 0.7256484149855907,
            "f1-score": 0.7494047619047619,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8140625,
            "recall": 0.8506122448979592,
            "f1-score": 0.831936127744511,
            "support": 2450.0
          },
          "accuracy": 0.798805256869773,
          "macro avg": {
            "precision": 0.7944158653846154,
            "recall": 0.788130329941775,
            "f1-score": 0.7906704448246364,
            "support": 4185.0
          },
          "weighted avg": {
            "precision": 0.7977724588732653,
            "recall": 0.798805256869773,
            "f1-score": 0.7977206152637548,
            "support": 4185.0
          }
        }
      },
      "test_metrics": {
        "accuracy": 0.7965,
        "precision": 0.8149,
        "recall": 0.8441,
        "specificity": 0.7291,
        "sensitivity": 0.8441,
        "f1_score": 0.8293,
        "macro_f1": 0.7887,
        "roc_auc": 0.8677,
        "pr_auc": 0.8959,
        "brier_score": 0.1437,
        "inference_time_ms_per_sample": 0.0003,
        "confusion_matrix": [
          [
            1265,
            470
          ],
          [
            382,
            2069
          ]
        ],
        "breakdown": {
          "tn": 1265,
          "fp": 470,
          "fn": 382,
          "tp": 2069
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7680631451123254,
            "recall": 0.729106628242075,
            "f1-score": 0.7480780603193377,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8148877510831036,
            "recall": 0.8441452468380253,
            "f1-score": 0.8292585170340682,
            "support": 2451.0
          },
          "accuracy": 0.7964644051600573,
          "macro avg": {
            "precision": 0.7914754480977145,
            "recall": 0.7866259375400502,
            "f1-score": 0.7886682886767029,
            "support": 4186.0
          },
          "weighted avg": {
            "precision": 0.7954800369504471,
            "recall": 0.7964644051600573,
            "f1-score": 0.7956110988782972,
            "support": 4186.0
          }
        }
      },
      "roc_curve": [
        {
          "fpr": 0.0,
          "tpr": 0.0
        },
        {
          "fpr": 0.0058,
          "tpr": 0.1469
        },
        {
          "fpr": 0.0133,
          "tpr": 0.215
        },
        {
          "fpr": 0.0202,
          "tpr": 0.2827
        },
        {
          "fpr": 0.0288,
          "tpr": 0.3513
        },
        {
          "fpr": 0.0363,
          "tpr": 0.4007
        },
        {
          "fpr": 0.0444,
          "tpr": 0.4292
        },
        {
          "fpr": 0.0536,
          "tpr": 0.4704
        },
        {
          "fpr": 0.0622,
          "tpr": 0.4986
        },
        {
          "fpr": 0.0709,
          "tpr": 0.5255
        },
        {
          "fpr": 0.079,
          "tpr": 0.5471
        },
        {
          "fpr": 0.0876,
          "tpr": 0.5867
        },
        {
          "fpr": 0.0997,
          "tpr": 0.6067
        },
        {
          "fpr": 0.1072,
          "tpr": 0.6267
        },
        {
          "fpr": 0.1164,
          "tpr": 0.6426
        },
        {
          "fpr": 0.1251,
          "tpr": 0.661
        },
        {
          "fpr": 0.1389,
          "tpr": 0.6834
        },
        {
          "fpr": 0.1493,
          "tpr": 0.6965
        },
        {
          "fpr": 0.1597,
          "tpr": 0.712
        },
        {
          "fpr": 0.1683,
          "tpr": 0.7271
        },
        {
          "fpr": 0.1775,
          "tpr": 0.7385
        },
        {
          "fpr": 0.1879,
          "tpr": 0.7576
        },
        {
          "fpr": 0.1983,
          "tpr": 0.7748
        },
        {
          "fpr": 0.211,
          "tpr": 0.7825
        },
        {
          "fpr": 0.2196,
          "tpr": 0.7944
        },
        {
          "fpr": 0.2346,
          "tpr": 0.8099
        },
        {
          "fpr": 0.2513,
          "tpr": 0.8197
        },
        {
          "fpr": 0.2605,
          "tpr": 0.8335
        },
        {
          "fpr": 0.2715,
          "tpr": 0.8446
        },
        {
          "fpr": 0.2888,
          "tpr": 0.8592
        },
        {
          "fpr": 0.3032,
          "tpr": 0.8703
        },
        {
          "fpr": 0.3233,
          "tpr": 0.8776
        },
        {
          "fpr": 0.3395,
          "tpr": 0.8862
        },
        {
          "fpr": 0.3568,
          "tpr": 0.8968
        },
        {
          "fpr": 0.3695,
          "tpr": 0.9037
        },
        {
          "fpr": 0.385,
          "tpr": 0.9119
        },
        {
          "fpr": 0.4035,
          "tpr": 0.9196
        },
        {
          "fpr": 0.4196,
          "tpr": 0.9257
        },
        {
          "fpr": 0.4415,
          "tpr": 0.9331
        },
        {
          "fpr": 0.468,
          "tpr": 0.9388
        },
        {
          "fpr": 0.4951,
          "tpr": 0.9461
        },
        {
          "fpr": 0.5193,
          "tpr": 0.951
        },
        {
          "fpr": 0.5447,
          "tpr": 0.9572
        },
        {
          "fpr": 0.5856,
          "tpr": 0.9637
        },
        {
          "fpr": 0.6455,
          "tpr": 0.9706
        },
        {
          "fpr": 0.6795,
          "tpr": 0.978
        },
        {
          "fpr": 0.7285,
          "tpr": 0.9841
        },
        {
          "fpr": 0.7925,
          "tpr": 0.9898
        },
        {
          "fpr": 0.8617,
          "tpr": 0.9951
        },
        {
          "fpr": 1.0,
          "tpr": 1.0
        }
      ],
      "pr_curve": [
        {
          "recall": 1.0,
          "precision": 0.5855
        },
        {
          "recall": 0.9992,
          "precision": 0.5972
        },
        {
          "recall": 0.998,
          "precision": 0.6091
        },
        {
          "recall": 0.9943,
          "precision": 0.6201
        },
        {
          "recall": 0.9927,
          "precision": 0.6328
        },
        {
          "recall": 0.9874,
          "precision": 0.6436
        },
        {
          "recall": 0.9837,
          "precision": 0.6562
        },
        {
          "recall": 0.9784,
          "precision": 0.6682
        },
        {
          "recall": 0.9714,
          "precision": 0.6795
        },
        {
          "recall": 0.9674,
          "precision": 0.6937
        },
        {
          "recall": 0.9604,
          "precision": 0.7063
        },
        {
          "recall": 0.9519,
          "precision": 0.7185
        },
        {
          "recall": 0.9445,
          "precision": 0.7321
        },
        {
          "recall": 0.9359,
          "precision": 0.7455
        },
        {
          "recall": 0.9249,
          "precision": 0.7579
        },
        {
          "recall": 0.9123,
          "precision": 0.7694
        },
        {
          "recall": 0.898,
          "precision": 0.7802
        },
        {
          "recall": 0.8821,
          "precision": 0.7905
        },
        {
          "recall": 0.8678,
          "precision": 0.8026
        },
        {
          "recall": 0.8503,
          "precision": 0.8125
        },
        {
          "recall": 0.8286,
          "precision": 0.8193
        },
        {
          "recall": 0.8103,
          "precision": 0.8296
        },
        {
          "recall": 0.7887,
          "precision": 0.8375
        },
        {
          "recall": 0.7691,
          "precision": 0.848
        },
        {
          "recall": 0.745,
          "precision": 0.8541
        },
        {
          "recall": 0.7209,
          "precision": 0.8611
        },
        {
          "recall": 0.6965,
          "precision": 0.8678
        },
        {
          "recall": 0.6732,
          "precision": 0.8767
        },
        {
          "recall": 0.6479,
          "precision": 0.8842
        },
        {
          "recall": 0.6234,
          "precision": 0.893
        },
        {
          "recall": 0.5969,
          "precision": 0.9003
        },
        {
          "recall": 0.5696,
          "precision": 0.9065
        },
        {
          "recall": 0.5406,
          "precision": 0.9107
        },
        {
          "recall": 0.51,
          "precision": 0.9131
        },
        {
          "recall": 0.4835,
          "precision": 0.9229
        },
        {
          "recall": 0.4537,
          "precision": 0.9274
        },
        {
          "recall": 0.4239,
          "precision": 0.9335
        },
        {
          "recall": 0.3953,
          "precision": 0.9426
        },
        {
          "recall": 0.3631,
          "precision": 0.9448
        },
        {
          "recall": 0.3325,
          "precision": 0.9521
        },
        {
          "recall": 0.2987,
          "precision": 0.9494
        },
        {
          "recall": 0.266,
          "precision": 0.9532
        },
        {
          "recall": 0.233,
          "precision": 0.9533
        },
        {
          "recall": 0.202,
          "precision": 0.963
        },
        {
          "recall": 0.1689,
          "precision": 0.9673
        },
        {
          "recall": 0.1363,
          "precision": 0.9738
        },
        {
          "recall": 0.1028,
          "precision": 0.9767
        },
        {
          "recall": 0.069,
          "precision": 0.9826
        },
        {
          "recall": 0.0355,
          "precision": 1.0
        },
        {
          "recall": 0.0,
          "precision": 1.0
        }
      ],
      "calibration_curve": [
        {
          "mean_predicted_value": 0.0638,
          "fraction_of_positives": 0.0599
        },
        {
          "mean_predicted_value": 0.1476,
          "fraction_of_positives": 0.1491
        },
        {
          "mean_predicted_value": 0.2452,
          "fraction_of_positives": 0.23
        },
        {
          "mean_predicted_value": 0.3484,
          "fraction_of_positives": 0.3759
        },
        {
          "mean_predicted_value": 0.4491,
          "fraction_of_positives": 0.4606
        },
        {
          "mean_predicted_value": 0.5527,
          "fraction_of_positives": 0.5853
        },
        {
          "mean_predicted_value": 0.6508,
          "fraction_of_positives": 0.67
        },
        {
          "mean_predicted_value": 0.7539,
          "fraction_of_positives": 0.7184
        },
        {
          "mean_predicted_value": 0.8547,
          "fraction_of_positives": 0.8488
        },
        {
          "mean_predicted_value": 0.943,
          "fraction_of_positives": 0.9448
        }
      ],
      "feature_importance": {
        "Academic Pressure": 0.2865,
        "Financial Stress": 0.1318,
        "Dietary Habits_Unhealthy": 0.0438,
        "Age": 0.0411,
        "Dietary Habits_Healthy": 0.0379,
        "Work/Study Hours": 0.0328,
        "Study Satisfaction": 0.0284,
        "Sleep Duration_More than 8 hours": 0.0235,
        "Sleep Duration_Less than 5 hours": 0.0203,
        "Degree_MA": 0.0152,
        "Degree_B.Pharm": 0.0143,
        "Degree_ME": 0.0139,
        "Degree_LLM": 0.0128,
        "Degree_B.Arch": 0.0126,
        "Degree_PhD": 0.0119
      },
      "model_path": "models/large_dataset\\xgboost.joblib"
    },
    "Support Vector Machine": {
      "name": "Support Vector Machine",
      "description": "Radial basis function (RBF) Support Vector Classifier with 3-fold Platt calibration.",
      "hyperparameters": {
        "kernel": "rbf",
        "C": 1.0,
        "gamma": "scale",
        "class_weight": "balanced",
        "calibration": "CalibratedClassifierCV (3-fold sigmoid)"
      },
      "training_duration_seconds": 9.479,
      "train_metrics": {
        "accuracy": 0.8106,
        "precision": 0.8611,
        "recall": 0.8066,
        "specificity": 0.8162,
        "sensitivity": 0.8066,
        "f1_score": 0.833,
        "macro_f1": 0.8071,
        "roc_auc": 0.8832,
        "pr_auc": 0.908,
        "brier_score": 0.1445,
        "inference_time_ms_per_sample": 0.7499,
        "confusion_matrix": [
          [
            6607,
            1488
          ],
          [
            2211,
            9224
          ]
        ],
        "breakdown": {
          "tn": 6607,
          "fp": 1488,
          "fn": 2211,
          "tp": 9224
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7492628713994103,
            "recall": 0.8161828289067325,
            "f1-score": 0.7812924968958789,
            "support": 8095.0
          },
          "Depressed": {
            "precision": 0.8610903659447349,
            "recall": 0.8066462614779186,
            "f1-score": 0.8329796360680904,
            "support": 11435.0
          },
          "accuracy": 0.8105990783410139,
          "macro avg": {
            "precision": 0.8051766186720726,
            "recall": 0.8114145451923256,
            "f1-score": 0.8071360664819847,
            "support": 19530.0
          },
          "weighted avg": {
            "precision": 0.8147389287535213,
            "recall": 0.8105990783410139,
            "f1-score": 0.8115558064931261,
            "support": 19530.0
          }
        }
      },
      "validation_metrics": {
        "accuracy": 0.7735,
        "precision": 0.8291,
        "recall": 0.7722,
        "specificity": 0.7752,
        "sensitivity": 0.7722,
        "f1_score": 0.7997,
        "macro_f1": 0.7695,
        "roc_auc": 0.8469,
        "pr_auc": 0.8827,
        "brier_score": 0.1595,
        "inference_time_ms_per_sample": 0.7526,
        "confusion_matrix": [
          [
            1345,
            390
          ],
          [
            558,
            1892
          ]
        ],
        "breakdown": {
          "tn": 1345,
          "fp": 390,
          "fn": 558,
          "tp": 1892
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7067787703625854,
            "recall": 0.7752161383285303,
            "f1-score": 0.7394172622319956,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8290972830850132,
            "recall": 0.7722448979591837,
            "f1-score": 0.7996618765849535,
            "support": 2450.0
          },
          "accuracy": 0.7734767025089606,
          "macro avg": {
            "precision": 0.7679380267237993,
            "recall": 0.773730518143857,
            "f1-score": 0.7695395694084746,
            "support": 4185.0
          },
          "weighted avg": {
            "precision": 0.7783869797221907,
            "recall": 0.7734767025089606,
            "f1-score": 0.7746859134063675,
            "support": 4185.0
          }
        }
      },
      "test_metrics": {
        "accuracy": 0.7745,
        "precision": 0.8255,
        "recall": 0.7797,
        "specificity": 0.7671,
        "sensitivity": 0.7797,
        "f1_score": 0.8019,
        "macro_f1": 0.7701,
        "roc_auc": 0.8415,
        "pr_auc": 0.8817,
        "brier_score": 0.1617,
        "inference_time_ms_per_sample": 0.7503,
        "confusion_matrix": [
          [
            1331,
            404
          ],
          [
            540,
            1911
          ]
        ],
        "breakdown": {
          "tn": 1331,
          "fp": 404,
          "fn": 540,
          "tp": 1911
        },
        "classification_report": {
          "Non-Depressed": {
            "precision": 0.7113842864778194,
            "recall": 0.7671469740634006,
            "f1-score": 0.7382140876317249,
            "support": 1735.0
          },
          "Depressed": {
            "precision": 0.8254859611231101,
            "recall": 0.7796817625458996,
            "f1-score": 0.8019303399076794,
            "support": 2451.0
          },
          "accuracy": 0.7744863831820353,
          "macro avg": {
            "precision": 0.7684351238004647,
            "recall": 0.7734143683046502,
            "f1-score": 0.7700722137697021,
            "support": 4186.0
          },
          "weighted avg": {
            "precision": 0.778193461001376,
            "recall": 0.7744863831820353,
            "f1-score": 0.7755214298028583,
            "support": 4186.0
          }
        }
      },
      "roc_curve": [
        {
          "fpr": 0.0,
          "tpr": 0.0
        },
        {
          "fpr": 0.0081,
          "tpr": 0.1542
        },
        {
          "fpr": 0.0167,
          "tpr": 0.2415
        },
        {
          "fpr": 0.0242,
          "tpr": 0.3031
        },
        {
          "fpr": 0.0346,
          "tpr": 0.3452
        },
        {
          "fpr": 0.045,
          "tpr": 0.4145
        },
        {
          "fpr": 0.0548,
          "tpr": 0.4472
        },
        {
          "fpr": 0.0634,
          "tpr": 0.4716
        },
        {
          "fpr": 0.072,
          "tpr": 0.5112
        },
        {
          "fpr": 0.0824,
          "tpr": 0.5369
        },
        {
          "fpr": 0.0928,
          "tpr": 0.5675
        },
        {
          "fpr": 0.102,
          "tpr": 0.5847
        },
        {
          "fpr": 0.1112,
          "tpr": 0.6059
        },
        {
          "fpr": 0.1205,
          "tpr": 0.6308
        },
        {
          "fpr": 0.1291,
          "tpr": 0.6483
        },
        {
          "fpr": 0.1401,
          "tpr": 0.6712
        },
        {
          "fpr": 0.1499,
          "tpr": 0.6871
        },
        {
          "fpr": 0.1597,
          "tpr": 0.7107
        },
        {
          "fpr": 0.1718,
          "tpr": 0.7271
        },
        {
          "fpr": 0.1873,
          "tpr": 0.7385
        },
        {
          "fpr": 0.1971,
          "tpr": 0.7528
        },
        {
          "fpr": 0.2133,
          "tpr": 0.7621
        },
        {
          "fpr": 0.2242,
          "tpr": 0.7744
        },
        {
          "fpr": 0.2392,
          "tpr": 0.7846
        },
        {
          "fpr": 0.2565,
          "tpr": 0.798
        },
        {
          "fpr": 0.2715,
          "tpr": 0.8078
        },
        {
          "fpr": 0.2945,
          "tpr": 0.8176
        },
        {
          "fpr": 0.3095,
          "tpr": 0.8262
        },
        {
          "fpr": 0.3256,
          "tpr": 0.8364
        },
        {
          "fpr": 0.3406,
          "tpr": 0.8478
        },
        {
          "fpr": 0.3643,
          "tpr": 0.8564
        },
        {
          "fpr": 0.3816,
          "tpr": 0.8662
        },
        {
          "fpr": 0.4075,
          "tpr": 0.8764
        },
        {
          "fpr": 0.434,
          "tpr": 0.8825
        },
        {
          "fpr": 0.4582,
          "tpr": 0.8927
        },
        {
          "fpr": 0.4893,
          "tpr": 0.9013
        },
        {
          "fpr": 0.5084,
          "tpr": 0.9094
        },
        {
          "fpr": 0.5343,
          "tpr": 0.9168
        },
        {
          "fpr": 0.5723,
          "tpr": 0.9233
        },
        {
          "fpr": 0.5977,
          "tpr": 0.9323
        },
        {
          "fpr": 0.63,
          "tpr": 0.9392
        },
        {
          "fpr": 0.6646,
          "tpr": 0.9461
        },
        {
          "fpr": 0.6974,
          "tpr": 0.9527
        },
        {
          "fpr": 0.7395,
          "tpr": 0.9604
        },
        {
          "fpr": 0.7769,
          "tpr": 0.9661
        },
        {
          "fpr": 0.8052,
          "tpr": 0.9739
        },
        {
          "fpr": 0.8352,
          "tpr": 0.9804
        },
        {
          "fpr": 0.872,
          "tpr": 0.9865
        },
        {
          "fpr": 0.9233,
          "tpr": 0.9939
        },
        {
          "fpr": 1.0,
          "tpr": 1.0
        }
      ],
      "pr_curve": [
        {
          "recall": 1.0,
          "precision": 0.5855
        },
        {
          "recall": 0.998,
          "precision": 0.5964
        },
        {
          "recall": 0.9931,
          "precision": 0.6061
        },
        {
          "recall": 0.9865,
          "precision": 0.6153
        },
        {
          "recall": 0.98,
          "precision": 0.6247
        },
        {
          "recall": 0.9698,
          "precision": 0.6323
        },
        {
          "recall": 0.9641,
          "precision": 0.6432
        },
        {
          "recall": 0.9576,
          "precision": 0.6541
        },
        {
          "recall": 0.9486,
          "precision": 0.6637
        },
        {
          "recall": 0.9425,
          "precision": 0.6758
        },
        {
          "recall": 0.9339,
          "precision": 0.687
        },
        {
          "recall": 0.9229,
          "precision": 0.6966
        },
        {
          "recall": 0.9155,
          "precision": 0.7099
        },
        {
          "recall": 0.9041,
          "precision": 0.7204
        },
        {
          "recall": 0.8935,
          "precision": 0.7324
        },
        {
          "recall": 0.8821,
          "precision": 0.7442
        },
        {
          "recall": 0.8727,
          "precision": 0.7585
        },
        {
          "recall": 0.8568,
          "precision": 0.7681
        },
        {
          "recall": 0.8421,
          "precision": 0.7792
        },
        {
          "recall": 0.8262,
          "precision": 0.7901
        },
        {
          "recall": 0.8119,
          "precision": 0.8031
        },
        {
          "recall": 0.7964,
          "precision": 0.8161
        },
        {
          "recall": 0.7789,
          "precision": 0.8275
        },
        {
          "recall": 0.7597,
          "precision": 0.838
        },
        {
          "recall": 0.7389,
          "precision": 0.8478
        },
        {
          "recall": 0.7173,
          "precision": 0.8571
        },
        {
          "recall": 0.6948,
          "precision": 0.8667
        },
        {
          "recall": 0.6687,
          "precision": 0.8718
        },
        {
          "recall": 0.6434,
          "precision": 0.879
        },
        {
          "recall": 0.6157,
          "precision": 0.883
        },
        {
          "recall": 0.5887,
          "precision": 0.8885
        },
        {
          "recall": 0.5643,
          "precision": 0.8992
        },
        {
          "recall": 0.5345,
          "precision": 0.9016
        },
        {
          "recall": 0.508,
          "precision": 0.9108
        },
        {
          "recall": 0.4774,
          "precision": 0.9126
        },
        {
          "recall": 0.4484,
          "precision": 0.9189
        },
        {
          "recall": 0.4206,
          "precision": 0.928
        },
        {
          "recall": 0.3905,
          "precision": 0.9327
        },
        {
          "recall": 0.3574,
          "precision": 0.9319
        },
        {
          "recall": 0.3268,
          "precision": 0.9368
        },
        {
          "recall": 0.2978,
          "precision": 0.9493
        },
        {
          "recall": 0.2668,
          "precision": 0.9561
        },
        {
          "recall": 0.2338,
          "precision": 0.9582
        },
        {
          "recall": 0.2016,
          "precision": 0.963
        },
        {
          "recall": 0.1685,
          "precision": 0.965
        },
        {
          "recall": 0.1355,
          "precision": 0.9708
        },
        {
          "recall": 0.1016,
          "precision": 0.9689
        },
        {
          "recall": 0.0673,
          "precision": 0.9649
        },
        {
          "recall": 0.0351,
          "precision": 1.0
        },
        {
          "recall": 0.0,
          "precision": 1.0
        }
      ],
      "calibration_curve": [
        {
          "mean_predicted_value": 0.1739,
          "fraction_of_positives": 0.0722
        },
        {
          "mean_predicted_value": 0.2545,
          "fraction_of_positives": 0.2015
        },
        {
          "mean_predicted_value": 0.3491,
          "fraction_of_positives": 0.2698
        },
        {
          "mean_predicted_value": 0.4441,
          "fraction_of_positives": 0.4462
        },
        {
          "mean_predicted_value": 0.548,
          "fraction_of_positives": 0.6279
        },
        {
          "mean_predicted_value": 0.6491,
          "fraction_of_positives": 0.75
        },
        {
          "mean_predicted_value": 0.7495,
          "fraction_of_positives": 0.8263
        },
        {
          "mean_predicted_value": 0.8521,
          "fraction_of_positives": 0.8722
        },
        {
          "mean_predicted_value": 0.9616,
          "fraction_of_positives": 0.9435
        }
      ],
      "feature_importance": {
        "note": "Dual RBF kernel operates in infinite-dimensional Hilbert space; linear MDI not available. Use permutation importance for global ranking."
      },
      "model_path": "models/large_dataset\\support_vector_machine.joblib"
    }
  }
};

export const SMALL_DATASET_METRICS = {
  "dataset_provenance": "163-RECORD DATASET \u2014 PROVENANCE UNVERIFIED",
  "dataset_file": "ml_lab/data/raw/STUDENT dataset.xlsx",
  "total_raw_records": 162,
  "primary_cohort_size": 143,
  "excluded_not_sure_records": 19,
  "class_distribution": {
    "negative_no (0)": 98,
    "positive_yes (1)": 45,
    "positive_class_prevalence_pct": 31.47
  },
  "evaluation_protocol": "Repeated Stratified 5-Fold Cross Validation (5 folds x 5 repeats = 25 evaluations)",
  "holdout_test_set_status": "NO INDEPENDENT HOLDOUT TEST SET FORMED",
  "holdout_rationale": "Sample size (N=143, 45 positive cases) is too small to split an independent holdout without crippling training representation and incurring severe sampling variance. All metrics reported represent out-of-fold cross-validation performance with 95% confidence intervals.",
  "features_used": {
    "numerical": [
      "Age",
      "CGPA",
      "Academic_Pressure",
      "Study_Satisfaction",
      "Work_Study_Hours",
      "Financial_Stress"
    ],
    "categorical": [
      "Gender",
      "Dietary_Habits",
      "Degree_Category",
      "Sleep_Duration"
    ]
  },
  "timestamp": "2026-11-16T18:30:00Z",
  "models": {
    "Logistic Regression": {
      "name": "Logistic Regression",
      "description": "L2-regularized linear model with standardized features and balanced class weights.",
      "hyperparameters": {
        "C": 1.0,
        "penalty": "l2",
        "solver": "lbfgs",
        "class_weight": "balanced"
      },
      "cv_duration_seconds": 0.51,
      "metrics_summary": {
        "accuracy": {
          "mean": 0.6384,
          "std": 0.0887,
          "ci_95_lower": 0.6018,
          "ci_95_upper": 0.675
        },
        "precision": {
          "mean": 0.4575,
          "std": 0.1629,
          "ci_95_lower": 0.3903,
          "ci_95_upper": 0.5247
        },
        "recall": {
          "mean": 0.5333,
          "std": 0.1757,
          "ci_95_lower": 0.4608,
          "ci_95_upper": 0.6059
        },
        "specificity": {
          "mean": 0.6872,
          "std": 0.1278,
          "ci_95_lower": 0.6344,
          "ci_95_upper": 0.7399
        },
        "sensitivity": {
          "mean": 0.5333,
          "std": 0.1757,
          "ci_95_lower": 0.4608,
          "ci_95_upper": 0.6059
        },
        "f1_score": {
          "mean": 0.4776,
          "std": 0.1264,
          "ci_95_lower": 0.4254,
          "ci_95_upper": 0.5298
        },
        "roc_auc": {
          "mean": 0.6252,
          "std": 0.0969,
          "ci_95_lower": 0.5852,
          "ci_95_upper": 0.6653
        },
        "brier_score": {
          "mean": 0.2417,
          "std": 0.0379,
          "ci_95_lower": 0.2261,
          "ci_95_upper": 0.2573
        }
      },
      "fold_level_metrics": [
        {
          "fold": 0,
          "accuracy": 0.6551724137931034,
          "precision": 0.47058823529411764,
          "recall": 0.8888888888888888,
          "specificity": 0.55,
          "f1_score": 0.6153846153846153,
          "roc_auc": 0.7611111111111111,
          "brier_score": 0.22606798108908324
        },
        {
          "fold": 1,
          "accuracy": 0.4827586206896552,
          "precision": 0.2,
          "recall": 0.2222222222222222,
          "specificity": 0.6,
          "f1_score": 0.2105263157894737,
          "roc_auc": 0.47777777777777775,
          "brier_score": 0.2705025787112365
        },
        {
          "fold": 2,
          "accuracy": 0.5517241379310345,
          "precision": 0.25,
          "recall": 0.2222222222222222,
          "specificity": 0.7,
          "f1_score": 0.23529411764705882,
          "roc_auc": 0.4555555555555555,
          "brier_score": 0.29262409012042195
        },
        {
          "fold": 3,
          "accuracy": 0.75,
          "precision": 0.5833333333333334,
          "recall": 0.7777777777777778,
          "specificity": 0.7368421052631579,
          "f1_score": 0.6666666666666666,
          "roc_auc": 0.8011695906432749,
          "brier_score": 0.16716933431785827
        },
        {
          "fold": 4,
          "accuracy": 0.6428571428571429,
          "precision": 0.46153846153846156,
          "recall": 0.6666666666666666,
          "specificity": 0.631578947368421,
          "f1_score": 0.5454545454545455,
          "roc_auc": 0.6198830409356726,
          "brier_score": 0.23945660103844305
        }
      ],
      "model_path": "models/real_world_163\\logistic_regression_163.joblib"
    },
    "Random Forest": {
      "name": "Random Forest",
      "description": "Small-sample constrained Random Forest with conservative depth limit to prevent leaf memorization.",
      "hyperparameters": {
        "n_estimators": 100,
        "max_depth": 5,
        "min_samples_split": 4,
        "class_weight": "balanced"
      },
      "cv_duration_seconds": 3.498,
      "metrics_summary": {
        "accuracy": {
          "mean": 0.6981,
          "std": 0.0922,
          "ci_95_lower": 0.6601,
          "ci_95_upper": 0.7362
        },
        "precision": {
          "mean": 0.5437,
          "std": 0.1703,
          "ci_95_lower": 0.4734,
          "ci_95_upper": 0.614
        },
        "recall": {
          "mean": 0.5289,
          "std": 0.1548,
          "ci_95_lower": 0.465,
          "ci_95_upper": 0.5928
        },
        "specificity": {
          "mean": 0.7761,
          "std": 0.1248,
          "ci_95_lower": 0.7246,
          "ci_95_upper": 0.8276
        },
        "sensitivity": {
          "mean": 0.5289,
          "std": 0.1548,
          "ci_95_lower": 0.465,
          "ci_95_upper": 0.5928
        },
        "f1_score": {
          "mean": 0.5241,
          "std": 0.1331,
          "ci_95_lower": 0.4692,
          "ci_95_upper": 0.5791
        },
        "roc_auc": {
          "mean": 0.7268,
          "std": 0.0817,
          "ci_95_lower": 0.693,
          "ci_95_upper": 0.7605
        },
        "brier_score": {
          "mean": 0.1966,
          "std": 0.0235,
          "ci_95_lower": 0.1869,
          "ci_95_upper": 0.2063
        }
      },
      "fold_level_metrics": [
        {
          "fold": 0,
          "accuracy": 0.6206896551724138,
          "precision": 0.4444444444444444,
          "recall": 0.8888888888888888,
          "specificity": 0.5,
          "f1_score": 0.5925925925925926,
          "roc_auc": 0.8277777777777778,
          "brier_score": 0.196779564236658
        },
        {
          "fold": 1,
          "accuracy": 0.5517241379310345,
          "precision": 0.3,
          "recall": 0.3333333333333333,
          "specificity": 0.65,
          "f1_score": 0.3157894736842105,
          "roc_auc": 0.538888888888889,
          "brier_score": 0.23204361261892667
        },
        {
          "fold": 2,
          "accuracy": 0.6896551724137931,
          "precision": 0.5,
          "recall": 0.3333333333333333,
          "specificity": 0.85,
          "f1_score": 0.4,
          "roc_auc": 0.6833333333333333,
          "brier_score": 0.20211507906003195
        },
        {
          "fold": 3,
          "accuracy": 0.8928571428571429,
          "precision": 1.0,
          "recall": 0.6666666666666666,
          "specificity": 1.0,
          "f1_score": 0.8,
          "roc_auc": 0.8421052631578947,
          "brier_score": 0.15167115653484028
        },
        {
          "fold": 4,
          "accuracy": 0.5714285714285714,
          "precision": 0.36363636363636365,
          "recall": 0.4444444444444444,
          "specificity": 0.631578947368421,
          "f1_score": 0.39999999999999997,
          "roc_auc": 0.6783625730994152,
          "brier_score": 0.22557156267144102
        }
      ],
      "model_path": "models/real_world_163\\random_forest_163.joblib"
    },
    "XGBoost": {
      "name": "XGBoost",
      "description": "Shallow gradient-boosted trees with aggressive shrinkage for small-sample stability.",
      "hyperparameters": {
        "n_estimators": 100,
        "max_depth": 3,
        "learning_rate": 0.03,
        "subsample": 0.8,
        "colsample_bytree": 0.8
      },
      "cv_duration_seconds": 1.058,
      "metrics_summary": {
        "accuracy": {
          "mean": 0.7215,
          "std": 0.0574,
          "ci_95_lower": 0.6978,
          "ci_95_upper": 0.7452
        },
        "precision": {
          "mean": 0.6345,
          "std": 0.2014,
          "ci_95_lower": 0.5514,
          "ci_95_upper": 0.7176
        },
        "recall": {
          "mean": 0.3422,
          "std": 0.128,
          "ci_95_lower": 0.2894,
          "ci_95_upper": 0.3951
        },
        "specificity": {
          "mean": 0.8958,
          "std": 0.0785,
          "ci_95_lower": 0.8634,
          "ci_95_upper": 0.9282
        },
        "sensitivity": {
          "mean": 0.3422,
          "std": 0.128,
          "ci_95_lower": 0.2894,
          "ci_95_upper": 0.3951
        },
        "f1_score": {
          "mean": 0.429,
          "std": 0.1224,
          "ci_95_lower": 0.3785,
          "ci_95_upper": 0.4795
        },
        "roc_auc": {
          "mean": 0.7266,
          "std": 0.0821,
          "ci_95_lower": 0.6927,
          "ci_95_upper": 0.7605
        },
        "brier_score": {
          "mean": 0.1871,
          "std": 0.0266,
          "ci_95_lower": 0.1761,
          "ci_95_upper": 0.1981
        }
      },
      "fold_level_metrics": [
        {
          "fold": 0,
          "accuracy": 0.7586206896551724,
          "precision": 0.6,
          "recall": 0.6666666666666666,
          "specificity": 0.8,
          "f1_score": 0.631578947368421,
          "roc_auc": 0.8222222222222222,
          "brier_score": 0.15173421800136566
        },
        {
          "fold": 1,
          "accuracy": 0.7586206896551724,
          "precision": 0.75,
          "recall": 0.3333333333333333,
          "specificity": 0.95,
          "f1_score": 0.46153846153846156,
          "roc_auc": 0.5055555555555555,
          "brier_score": 0.22561220824718475
        },
        {
          "fold": 2,
          "accuracy": 0.6551724137931034,
          "precision": 0.3333333333333333,
          "recall": 0.1111111111111111,
          "specificity": 0.9,
          "f1_score": 0.16666666666666666,
          "roc_auc": 0.6888888888888889,
          "brier_score": 0.20162317156791687
        },
        {
          "fold": 3,
          "accuracy": 0.75,
          "precision": 1.0,
          "recall": 0.2222222222222222,
          "specificity": 1.0,
          "f1_score": 0.3636363636363636,
          "roc_auc": 0.8421052631578948,
          "brier_score": 0.1550944298505783
        },
        {
          "fold": 4,
          "accuracy": 0.6071428571428571,
          "precision": 0.375,
          "recall": 0.3333333333333333,
          "specificity": 0.7368421052631579,
          "f1_score": 0.35294117647058826,
          "roc_auc": 0.7076023391812866,
          "brier_score": 0.22139476239681244
        }
      ],
      "model_path": "models/real_world_163\\xgboost_163.joblib"
    },
    "Support Vector Machine": {
      "name": "Support Vector Machine",
      "description": "RBF Support Vector Machine with 3-fold Platt scaling for calibrated probabilities.",
      "hyperparameters": {
        "kernel": "rbf",
        "C": 1.0,
        "gamma": "scale",
        "class_weight": "balanced",
        "calibration": "CalibratedClassifierCV (3-fold sigmoid)"
      },
      "cv_duration_seconds": 0.735,
      "metrics_summary": {
        "accuracy": {
          "mean": 0.7143,
          "std": 0.0521,
          "ci_95_lower": 0.6928,
          "ci_95_upper": 0.7358
        },
        "precision": {
          "mean": 0.6,
          "std": 0.3446,
          "ci_95_lower": 0.4578,
          "ci_95_upper": 0.7422
        },
        "recall": {
          "mean": 0.2267,
          "std": 0.1856,
          "ci_95_lower": 0.1501,
          "ci_95_upper": 0.3033
        },
        "specificity": {
          "mean": 0.9389,
          "std": 0.0786,
          "ci_95_lower": 0.9065,
          "ci_95_upper": 0.9714
        },
        "sensitivity": {
          "mean": 0.2267,
          "std": 0.1856,
          "ci_95_lower": 0.1501,
          "ci_95_upper": 0.3033
        },
        "f1_score": {
          "mean": 0.296,
          "std": 0.2022,
          "ci_95_lower": 0.2126,
          "ci_95_upper": 0.3795
        },
        "roc_auc": {
          "mean": 0.7238,
          "std": 0.0864,
          "ci_95_lower": 0.6881,
          "ci_95_upper": 0.7594
        },
        "brier_score": {
          "mean": 0.1898,
          "std": 0.017,
          "ci_95_lower": 0.1828,
          "ci_95_upper": 0.1969
        }
      },
      "fold_level_metrics": [
        {
          "fold": 0,
          "accuracy": 0.8275862068965517,
          "precision": 0.75,
          "recall": 0.6666666666666666,
          "specificity": 0.9,
          "f1_score": 0.7058823529411765,
          "roc_auc": 0.8055555555555556,
          "brier_score": 0.17015204235580142
        },
        {
          "fold": 1,
          "accuracy": 0.6896551724137931,
          "precision": 0.5,
          "recall": 0.3333333333333333,
          "specificity": 0.85,
          "f1_score": 0.4,
          "roc_auc": 0.5888888888888889,
          "brier_score": 0.21013868931154564
        },
        {
          "fold": 2,
          "accuracy": 0.6896551724137931,
          "precision": 0.5,
          "recall": 0.1111111111111111,
          "specificity": 0.95,
          "f1_score": 0.1818181818181818,
          "roc_auc": 0.6555555555555556,
          "brier_score": 0.20379155327148823
        },
        {
          "fold": 3,
          "accuracy": 0.6785714285714286,
          "precision": 0.0,
          "recall": 0.0,
          "specificity": 1.0,
          "f1_score": 0.0,
          "roc_auc": 0.7485380116959064,
          "brier_score": 0.1906976932678351
        },
        {
          "fold": 4,
          "accuracy": 0.6785714285714286,
          "precision": 0.0,
          "recall": 0.0,
          "specificity": 1.0,
          "f1_score": 0.0,
          "roc_auc": 0.7426900584795322,
          "brier_score": 0.1894138233124629
        }
      ],
      "model_path": "models/real_world_163\\support_vector_machine_163.joblib"
    }
  }
};
