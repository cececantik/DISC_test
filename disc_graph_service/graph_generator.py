
import base64
import bisect
import io
import os
from typing import Dict, List

import matplotlib
matplotlib.use("Agg")  # headless backend, required for server-side rendering
import matplotlib.pyplot as plt
import openpyxl


DIMENSIONS = ["D", "I", "S", "C"]

SCALE_TABLE_PATH = os.path.join(os.path.dirname(__file__), "disc_scale_table.xlsx")


def _load_scale_table(path: str = SCALE_TABLE_PATH) -> Dict[str, Dict[str, List]]:
    """
    Reads disc_scale_table.xlsx (shared row-grid format) and returns, per
    graph, per dimension, a list of (row_index, value) pairs - ONLY for
    rows where that column actually has a printed number (blanks skipped).

    Row 1 = top of the paper (highest plot position), row N = bottom.
    Row indices are shared across D/I/S/C, which is what lets the zone
    lines and cross-column comparisons line up correctly.

        {"Mask": {"D": [(1,20), (2,16), (3,15), (5,14), ...],
                   "I": [(1,17), (3,10), (5,7), ...],
                   ...,
                   "_max_row": 23},
         ...}
    """
    wb = openpyxl.load_workbook(path, data_only=True)
    table = {}
    for sheet_name in ["Mask", "Pressure", "Self"]:
        ws = wb[sheet_name]
        cols = {"D": [], "I": [], "S": [], "C": []}
        col_map = {"D": 2, "I": 3, "S": 4, "C": 5}
        max_row = 0
        zone_rows = {}  # {"4": row_idx, "3": row_idx, "2": row_idx, "1": row_idx}
        for row in ws.iter_rows(min_row=5):
            row_idx = row[0].value  # column A = "Baris"
            if row_idx is None:
                continue
            row_idx = int(row_idx)
            max_row = max(max_row, row_idx)
            for dim, col_idx in col_map.items():
                val = row[col_idx - 1].value
                if val is not None:
                    cols[dim].append((row_idx, float(val)))
            zone_val = row[5].value  # column F = "Zone"
            if zone_val is not None:
                zone_rows[str(zone_val).strip()] = row_idx
        cols["_max_row"] = max_row
        cols["_zone_rows"] = zone_rows
        table[sheet_name] = cols
    return table


def _row_to_fraction(row_idx: float, max_row: int) -> float:
    """Row 1 (top) -> 1.0, row max_row (bottom) -> 0.0."""
    if max_row <= 1:
        return 0.5
    return 1 - (row_idx - 1) / (max_row - 1)


def _value_to_position(raw_value: float, column_entries: List, max_row: int) -> float:
    """
    Converts a raw score into a vertical plot position (0.0 = bottom,
    1.0 = top), using this column's (row_index, value) pairs.

    Exact match -> that row's position.
    No exact match -> linear interpolation between the two nearest
    printed values IN THIS COLUMN (by value), using their real row
    positions (which may not be evenly spaced).
    Out of range -> clamped to the top or bottom entry.
    """
    if not column_entries:
        raise ValueError("Empty scale column - check disc_scale_table.xlsx")

    # column_entries is already in row order (top to bottom) since we
    # read the sheet top to bottom.
    for row_idx, val in column_entries:
        if val == raw_value:
            return _row_to_fraction(row_idx, max_row), False

    for i in range(len(column_entries) - 1):
        row1, v1 = column_entries[i]
        row2, v2 = column_entries[i + 1]
        lo, hi = min(v1, v2), max(v1, v2)
        if lo <= raw_value <= hi and v1 != v2:
            t = (raw_value - v1) / (v2 - v1)
            frac1 = _row_to_fraction(row1, max_row)
            frac2 = _row_to_fraction(row2, max_row)
            return frac1 + t * (frac2 - frac1), True

    # Out of the printed range entirely -> clamp to nearest end
    values = [v for _, v in column_entries]
    if raw_value > max(values):
        top_row = min(r for r, v in column_entries if v == max(values))
        return _row_to_fraction(top_row, max_row), True
    bottom_row = max(r for r, v in column_entries if v == min(values))
    return _row_to_fraction(bottom_row, max_row), True

# Single colour for all points/lines that match the paper exactly.
POINT_COLOR = "#264653"       # dark navy
LINE_COLOR = "#999999"        # neutral grey connecting line
INTERPOLATED_COLOR = "#E63946"  

# Maps our internal graph key -> (sheet name in disc_scale_table.xlsx, title,
# subtitle, which scoring_data fields to plot).
GRAPH_STYLES = {
    "mask": {
        "sheet": "Mask",
        "title": "Mask (Public Self)",
        "subtitle": "Bagaimana kamu terlihat oleh orang lain",
        "keys": ["most_d", "most_i", "most_s", "most_c"],
    },
    "pressure": {
        "sheet": "Pressure",
        "title": "Pressure (Private Self)",
        "subtitle": "Bagaimana kamu bereaksi di bawah tekanan",
        "keys": ["least_d", "least_i", "least_s", "least_c"],
    },
    "self": {
        "sheet": "Self",
        "title": "Self (Core / Natural)",
        "subtitle": "Kepribadian inti / kondisi natural kamu",
        "keys": ["change_d", "change_i", "change_s", "change_c"],
    },
}

def _validate_scoring_data(data: Dict) -> None:
    """Raise ValueError with a clear message if required keys are missing
    or not numeric. Fails fast instead of letting matplotlib throw a
    confusing error later."""
    required = set()
    for style in GRAPH_STYLES.values():
        required.update(style["keys"])

    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"Missing scoring fields: {missing}")

    non_numeric = [k for k in required if not isinstance(data[k], (int, float))]
    if non_numeric:
        raise ValueError(f"Non-numeric scoring fields: {non_numeric}")


def _render_single_graph(raw_values, style: dict, scale_columns: Dict[str, List[float]]) -> str:
    """Render one DISC line-graph using the non-linear scale and return it
    as a base64 PNG string."""
    fig, ax = plt.subplots(figsize=(5, 6), dpi=150)

    x_positions = range(len(DIMENSIONS))

    # Convert each raw score to its 0-1 vertical position using that
    # column's own printed scale (non-linear, per-dimension).
    max_row = scale_columns["_max_row"]
    plot_positions = []
    is_interpolated = []
    for i in range(len(DIMENSIONS)):
        pos, interpolated = _value_to_position(raw_values[i], scale_columns[DIMENSIONS[i]], max_row)
        plot_positions.append(pos)
        is_interpolated.append(interpolated)

    # Zone bands - drawn at their REAL row position from the paper
    # (column F in the Excel sheet), not an assumed even 25/50/75% split.
    zone_rows = scale_columns.get("_zone_rows", {})
    for label, row_idx in zone_rows.items():
        y = _row_to_fraction(row_idx, max_row)
        ax.axhline(y, color="#bbbbbb", linewidth=0.8, linestyle=":", zorder=0)
        ax.text(1.02, y, label, transform=ax.get_yaxis_transform(),
                fontsize=9, color="#888888", va="center")

    # Connecting line (thin, neutral grey - the DISC "profile silhouette")
    ax.plot(x_positions, plot_positions, color="#999999", linewidth=1.5, zorder=1)

    # Coloured point + raw-value label per dimension
    for x, y, raw, interpolated in zip(x_positions, plot_positions, raw_values, is_interpolated):
        color = INTERPOLATED_COLOR if interpolated else POINT_COLOR
        ax.scatter(x, y, s=140, color=color,
                   edgecolors="white", linewidths=1.5, zorder=3)
        label = f"{int(raw):+d}" if raw < 0 else f"{int(raw)}"
        offset = 0.03 if y < 0.95 else -0.05
        ax.text(x, y + offset, label,
                ha="center", va="bottom" if offset > 0 else "top",
                fontsize=10, fontweight="bold", color=color)
    if any(is_interpolated):
        ax.text(0.5, -0.12,
                "Merah = angka tidak tercetak persis di kertas,\nposisi dihitung otomatis",
                transform=ax.transAxes, ha="center", fontsize=7.5,
                color=INTERPOLATED_COLOR, style="italic")

    ax.set_xlim(-0.5, len(DIMENSIONS) - 0.5)
    ax.set_xticks(list(x_positions))
    ax.set_xticklabels(DIMENSIONS, fontsize=13, fontweight="bold")
    ax.set_ylim(-0.05, 1.08)
    ax.set_yticks([])  # the paper's numbers are per-column, not a shared axis

    for spine in ["top", "right", "left"]:
        ax.spines[spine].set_visible(False)

    fig.suptitle(style["title"], fontsize=13, fontweight="bold", y=0.98)
    ax.set_title(style["subtitle"], fontsize=8.5, color="#666666", pad=12)

    fig.tight_layout(rect=[0, 0, 1, 0.94])

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def generate_all_graphs(scoring_data: Dict, scale_table: Dict = None) -> Dict[str, str]:
    """
    scoring_data: dict containing most_d/i/s/c, least_d/i/s/c, change_d/i/s/c
                  (the same shape as the `results` table row).
    scale_table: optional pre-loaded table (from _load_scale_table()) to
                 avoid re-reading the xlsx file on every request. If not
                 given, it's loaded fresh each call.
    Returns: {"mask": base64_png, "pressure": base64_png, "self": base64_png}
    """
    _validate_scoring_data(scoring_data)

    if scale_table is None:
        scale_table = _load_scale_table()

    images = {}
    for graph_name, style in GRAPH_STYLES.items():
        raw_values = [scoring_data[k] for k in style["keys"]]
        scale_columns = scale_table[style["sheet"]]
        images[graph_name] = _render_single_graph(raw_values, style, scale_columns)
    return images

def interpret_profile(change_scores: Dict) -> Dict:
    mapping = {
        "D": change_scores.get("change_d", 0),
        "I": change_scores.get("change_i", 0),
        "S": change_scores.get("change_s", 0),
        "C": change_scores.get("change_c", 0),
    }

    dominant = max(mapping, key=mapping.get)
    secondary_candidates = {k: v for k, v in mapping.items() if k != dominant}
    secondary = max(secondary_candidates, key=secondary_candidates.get)

    return {
        "dominant_trait": dominant,
        "dominant_score": mapping[dominant],
        "secondary_trait": secondary,
        "secondary_score": mapping[secondary],
        "raw_scores": mapping,
    }
