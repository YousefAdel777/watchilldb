import sys
import pandas as pd
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from controllers.ClassificationController import get_classification_controller

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_classification.py <path/to/file.csv>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])

    if not csv_path.exists():
        print(f"Error: file not found: {csv_path}")
        sys.exit(1)

    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Loaded {len(df)} rows from {csv_path.name}")

    controller = get_classification_controller()

    result = controller.evaluate(df)

    for i, (movie, level) in enumerate(zip(result['movies'], result['popularityLevel'])):
        print(f"[{i}] {movie}: {level}")

    output_path = csv_path.parent / (csv_path.stem + "_classification.csv")
    pd.DataFrame({
        'movie': result['movies'],
        'popularityLevel': result['popularityLevel']
    }).to_csv(output_path, index=False)

    print(f"Saved to {output_path}")

if __name__ == "__main__":
    main()