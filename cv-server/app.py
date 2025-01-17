import argparse
from pathlib import Path

from utils import dedupe_files
from interrogator import Interrogator
from flask import Flask, request, jsonify

app = Flask(__name__)
interrogator = Interrogator()


@app.route("/models")
def models_endpoint():
    return jsonify(interrogator.models.get_model_list()), 200


@app.route("/tags")
def tags_endpoint():
    return jsonify(interrogator.tagger.list_tags()), 200


@app.route("/dedupe_files", methods=["POST"])
def process_dedupe_files_endpoint():
    data = request.json
    if data is None or "dir" not in data:
        return jsonify({"status": "error", "message": "dir not provided"}), 400
    count, pruned_files = dedupe_files(Path(data.dir))
    return jsonify(
        {
            "status": "success",
            "count": count,
            "pruned_files": pruned_files,
        }
    ), 200


@app.route("/process_file", methods=["POST"])
def process_file_endpoint():
    data = request.json
    defaults = {
        "threshold": 0.35,
        "character_threshold": 0.95,
    }
    args = argparse.Namespace(**{**defaults, **data})
    if args.path is None:
        return jsonify({"status": "error", "message": "path not provided"}), 400
    output_json = interrogator.process_file(
        image_path=args.path,
        threshold=args.threshold,
        character_threshold=args.character_threshold,
    )
    return jsonify(output_json), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
