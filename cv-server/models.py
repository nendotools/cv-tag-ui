import huggingface_hub


# reference definition of the model and where to find its data
class Model:
    def __init__(self, repo="", model_file="model.onnx", tags_file="selected_tags.csv") -> None:
        self.repo = repo
        self.model_file = model_file
        self.model_path = ""
        self.tags_file = tags_file
        self.tags_path = ""

    # load the model from the repo or cache
    def load_model(self):
        if self.model_path:
            return

        # load the model from the repo
        self.model_path = huggingface_hub.hf_hub_download(self.repo, self.model_file)
        self.tags_path = huggingface_hub.hf_hub_download(self.repo, self.tags_file)


class Models:
    def __init__(self) -> None:
        self.models: list[Model] = []

    def load_model(self, model_rep: str):
        for model in self.models:
            if model.repo == model_rep:
                model.load_model()
                return model

    def add_model(self, model_repo: str, model_file: str = "model.onnx", tags_file: str = "selected_tags.csv"):
        self.models.append(Model(model_repo, model_file, tags_file))

    def get_default_model(self):
        if len(self.models) == 0:
            self.add_model("SmilingWolf/wd-eva02-large-tagger-v3")
        return self.models[0]

    def get_model_list(self):
        # return a list of model repos
        return [model.repo for model in self.models]
