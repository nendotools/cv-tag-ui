import argparse
from pathlib import Path

from utils import dedupe_files, save_csv, save_json
from interrogator import Interrogator
from flask import Flask, request, jsonify

app = Flask(__name__)
interrogator = Interrogator()


@app.route("/models")
def models_endpoint():
    return jsonify(interrogator.models.get_model_list()), 200


@app.route("/tags")
def tags_endpoint():
    interrogator.ensure_model_loaded()
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
        "save_result": True,
    }
    args = argparse.Namespace(**{**defaults, **data})
    if args.file is None:
        return jsonify({"status": "error", "message": "file path not provided"}), 400
    output_json = interrogator.process_file(
        image_path=args.file,
        threshold=args.threshold,
        character_threshold=args.character_threshold,
    )
    if args.save_result:
        file_dir = Path(args.file).parent
        file_basename = Path(args.file).stem
        save_json(output_json, f"{file_dir}/{file_basename}.json")
        save_csv(list(output_json["high"].keys()), f"{file_dir}/{file_basename}.txt")

    return jsonify(output_json), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
