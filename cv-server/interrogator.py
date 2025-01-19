from pandas._config.config import config_prefix
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
        self.session = None
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
    ) -> dict:
        if not self.model or not self.tags:
            return {"error": "model not loaded"}
        if not self.session:
            self.session = rt.InferenceSession(self.model.model_path)
        _, height, _, _ = self.session.get_inputs()[0].shape
        self.model_target_size = height

        im = self.prepare_image(image_path)

        input_name = self.session.get_inputs()[0].name
        output_name = self.session.get_outputs()[0].name
        conf = self.session.run([output_name], {input_name: im})[0]

        # group tags by high_confidence and low_confidence, store tags as {tag: confidence}
        tags = self.tagger.tags[:][["name"]]
        tags["confidence"] = conf[0]

        # first 4 items are for rating
        _ = dict(tags[:4].values)

        # rest are regular tags
        tags = dict(tags[4:].values)
        grouped_tags = {"high": {}, "low": {}}
        for tag, confidence in tags.items():
            if confidence < 0.04:  # throw away tags with extremely low confidence
                continue
            # replace "_" with " " for better readability
            tag = tag.replace("_", " ")
            if tag in self.tagger.character_tags:
                if confidence > character_threshold:
                    grouped_tags["high"][tag] = confidence
                else:
                    grouped_tags["low"][tag] = confidence
            else:
                if confidence > threshold:
                    grouped_tags["high"][tag] = confidence
                else:
                    grouped_tags["low"][tag] = confidence
        # sort tag keys by confidence
        grouped_tags["high"] = dict(sorted(grouped_tags["high"].items(), key=lambda item: item[1], reverse=True))
        grouped_tags["low"] = dict(sorted(grouped_tags["low"].items(), key=lambda item: item[1], reverse=True))
        return grouped_tags

    def prepare_image(self, img: str):
        image = Image.open(img).convert("RGBA")
        print(image.size)
        target_size = self.model_target_size
        canvas = Image.new("RGBA", image.size, (255, 255, 255))
        print(canvas.size)
        canvas.alpha_composite(image)
        image = canvas.convert("RGB")

        # Pad image to square
        image_shape = image.size
        max_dim = max(image_shape)
        pad_left = (max_dim - image_shape[0]) // 2
        pad_top = (max_dim - image_shape[1]) // 2

        padded_image = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
        padded_image.paste(image, (pad_left, pad_top))

        # Resize
        if max_dim != target_size:
            padded_image = padded_image.resize(
                (target_size, target_size),
                Image.BICUBIC,
            )

        # Convert to numpy array
        image_array = np.asarray(padded_image, dtype=np.float32)

        # Convert PIL-native RGB to BGR
        image_array = image_array[:, :, ::-1]

        return np.expand_dims(image_array, axis=0)
