import os

import pandas as pd


class Tagger:
    def __init__(self) -> None:
        self.character_tags: list[str] = []
        self.general_tags: list[str] = []
        self.rating_tags: list[str] = []

    def source_tags(self, tag_path: str):
        if not tag_path or not tag_path.endswith(".csv") or not os.path.exists(tag_path):
            return

        self.tags = []
        self.tags = pd.read_csv(tag_path, sep=",", header=0, index_col=0)
        # tag format: [tag, description, type_id, count]
        for tag in self.tags:
            if tag[2] == 9:
                self.rating_tags.append(tag[1])
            if tag[2] == 4:
                self.character_tags.append(tag[1])
            if tag[2] == 0:
                self.general_tags.append(tag[1])

        print(
            f"Loaded {len(self.character_tags)} character tags, {len(self.general_tags)} general tags, and {len(self.rating_tags)} rating tags"
        )
        return {"character": self.character_tags, "general": self.general_tags, "rating": self.rating_tags}

    # should return a list of {name: str, category: int} objects
    def list_tags(self) -> list[dict]:
        tags = []
        for tag in self.character_tags:
            tags.append({"name": tag, "category": 4})
        for tag in self.general_tags:
            tags.append({"name": tag, "category": 0})
        for tag in self.rating_tags:
            tags.append({"name": tag, "category": 9})
        return tags
