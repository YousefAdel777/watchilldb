import sys
import pandas as pd
import requests
from pathlib import Path
import json
import math

API_URL = "http://localhost:8000/api/v1/regression/batch"

def predict_batch(payloads: list[dict]) -> dict:
    response = requests.post(API_URL, json=payloads, timeout=60)
    if response.status_code == 422:
        print(json.dumps(response.json(), indent=2))
    response.raise_for_status()
    return response.json()

def clean_value(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    return v

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_regression.py <path/to/file.csv>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])

    if not csv_path.exists():
        print(f"Error: file not found: {csv_path}")
        sys.exit(1)

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows from {csv_path.name}")

    payloads = [
        {k: clean_value(v) for k, v in row.items()}
        for row in df.to_dict(orient="records")
    ]

    try:
        result = predict_batch(payloads)
        predictions = result.get("predictedPopularity", [])

        results = [
            {"movie_index": i, "status": "ok", "predictedPopularity": p}
            for i, p in enumerate(predictions)
        ]

        for r in results:
            print(f"[{r['movie_index']}] OK: {r['predictedPopularity']}")

    except requests.HTTPError as e:
        error_body = e.response.text if e.response else str(e)
        print(f"HTTP error: {error_body}")
        results = [{"movie_index": i, "status": "error"} for i in range(len(payloads))]

    output_path = csv_path.parent / (csv_path.stem + "_regression.csv")
    pd.DataFrame(results).to_csv(output_path, index=False)

    print(f"Saved to {output_path}")

if __name__ == "__main__":
    main()