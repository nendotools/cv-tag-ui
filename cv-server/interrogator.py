from models import Model, Models
from tags import Tagger

import numpy as np
import onnxruntime as rt
from PIL import Image


# main class for the interrogator, should handle fetching the model and tags based on a provided model repo
class Interrogator:
    def __init__(self) -> None:
        self.model: Model | None = None
        self.models = Models()
        self.tagger = Tagger()

        model = self.models.get_default_model()
        self.load_model(model.repo)

    def load_model(self, model_repo: str):
        self.model = self.models.load_model(model_repo)
        if not self.model:
            return
        print(f"Loaded model from {model_repo}")
        self.tags = self.tagger.source_tags(self.model.tags_path)
        print(f"Loaded tags from {self.model.tags_path}")

    def process_file(
        self,
        image_path: str,
        threshold: float = 0.35,
        character_threshold: float = 0.95,
    ) -> dict[str, float]:
        if not self.model:
            return {"error": "model not loaded"}

        im = Image.open(image_path)
        im = im.convert("RGB")
        im = im.resize((224, 224))
        im = np.array(im).astype(np.float32) / 255.0
        im = np.transpose(im, (2, 0, 1))
        im = np.expand_dims(im, axis=0)
        session = rt.InferenceSession(self.model.model_path)
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        output = session.run([output_name], {input_name: im})[0][0]

        # group tags by high_confidence and low_confidence, store tags as {tag: confidence}
        tags = {tag: float(confidence) for tag, confidence in zip(self.tags, output)}
        grouped_tags = {"high": {}, "low": {}}
        for tag, confidence in tags.items():
            # if tag is a character tag, compare to character threshold
            if tag in self.tagger.character_tags:
                if confidence >= character_threshold:
                    grouped_tags["high"][tag] = confidence
                else:
                    grouped_tags["low"][tag] = confidence
            # if tag is not a character tag, compare to normal threshold
            else:
                if confidence >= threshold:
                    grouped_tags["high"][tag] = confidence
                else:
                    grouped_tags["low"[tag]] = confidence
        return grouped_tags
