"""
test_sample.py
--------------
Quick sanity check - generates 3 preview PNGs from sample scoring data
without needing to spin up the Flask server.

Run:
    python test_sample.py
Output:
    preview_mask.png, preview_pressure.png, preview_self.png
"""

import base64
from graph_generator import generate_all_graphs, interpret_profile

# Sample data - same shape as the `results` table row
SAMPLE_SCORING_DATA = {
    "attempt_id": 2,
    "most_d": 5, "most_i": 6, "most_s": 4, "most_c": 9, "most_star": 0,
    "least_d": 3, "least_i": 2, "least_s": 8, "least_c": 5, "least_star": 6,
    "change_d": 2, "change_i": 4, "change_s": -4, "change_c": 4, "change_star": 6,
}


def main():
    print("Generating graphs from sample data...")
    images = generate_all_graphs(SAMPLE_SCORING_DATA)

    for name, b64 in images.items():
        filename = f"preview_{name}.png"
        with open(filename, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"  - {filename} ({len(b64)} base64 chars)")

    print("\nInterpretation:")
    result = interpret_profile(SAMPLE_SCORING_DATA)
    for k, v in result.items():
        print(f"  {k}: {v}")

    print("\nAll good! Check the generated PNG files.")


if __name__ == "__main__":
    main()
