"""
app.py
------
Flask service that Express calls to generate the 3 DISC profile graphs.

Run:
    python app.py
    # listens on http://localhost:5000

Express side (axios) call example:
    POST http://localhost:5000/generate-graph
    Body: {
      "attempt_id": 2,
      "most_d": 5, "most_i": 6, "most_s": 4, "most_c": 9, "most_star": 0,
      "least_d": 3, "least_i": 2, "least_s": 8, "least_c": 5, "least_star": 6,
      "change_d": 2, "change_i": 4, "change_s": -4, "change_c": 4, "change_star": 6
    }
"""

from flask import Flask, request, jsonify
from graph_generator import generate_all_graphs, interpret_profile

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/generate-graph", methods=["POST"])
def generate_graph():
    data = request.get_json(silent=True)

    print("Data yang diterima Flask:")
    print(data)
    if not data:
        return jsonify({"error": "Request body harus JSON dan tidak boleh kosong"}), 400

    if "attempt_id" not in data:
        return jsonify({"error": "Field 'attempt_id' wajib ada"}), 400

    try:
        images = generate_all_graphs(data)
    except ValueError as e:
        # Missing/invalid scoring fields -> 400, not 500
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Unexpected rendering failure -> 500, but don't leak internals
        app.logger.exception("Graph generation failed")
        return jsonify({"error": "Gagal generate graph. Cek server log."}), 500

    interpretation = interpret_profile({
        "change_d": data.get("change_d", 0),
        "change_i": data.get("change_i", 0),
        "change_s": data.get("change_s", 0),
        "change_c": data.get("change_c", 0),
    })

    return jsonify({
        "attempt_id": data["attempt_id"],
        "graphs": {
            "mask": {"image_base64": images["mask"], "format": "png"},
            "pressure": {"image_base64": images["pressure"], "format": "png"},
            "self": {"image_base64": images["self"], "format": "png"},
        },
        "interpretation": interpretation,
    }), 200


if __name__ == "__main__":
    # debug=True only for local dev - turn off in production
    app.run(host="0.0.0.0", port=5000, debug=False)
