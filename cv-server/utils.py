def dedupe_files(path):
    # remove duplicate files by hash in the directory
    hashes = {}
    # iterate over files in the directory and sort them by name
    count = 0
    pruned_files = []
    files = sorted(path.iterdir(), key=lambda x: len(x.name))
    for file in files:
        if file.is_file():
            with open(file, "rb") as f:
                filehash = hash(f.read())
                if filehash in hashes:
                    print("deleting duplicate:", file)
                    file.unlink()
                    count += 1
                    pruned_files.append(file.name)
                else:
                    hashes[filehash] = file
    return count, pruned_files
