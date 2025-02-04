# Computer Vision Tagging Utility

This project provides a web-interface for managing and tagging images for
T2I/T2V training. The interface allows for easy creation of directories,
uploading of images, cropping, letter-boxing, and tagging of images.

While it is in a functional state, it is still a work in progress and may not
work 100% as expected. If you encounter any issues, please report them in the
Issues tab.

## Installation

Currently, the target OS is Linux. It may work on Windows, but it has not been
thoroughly tested. To install, follow these steps:

```bash
git clone git@github.com:nendotools/cv-tag-ui.git
cd cv-tag-ui
yarn setup
```

You will be prompted to decide if you want to install with GPU support. Entering
`n` will install dependencies to run with CPU tagging, which can be slow, but
should support most use-cases. Entering `y` will install dependencies to run
with GPU support, which requires an NVIDIA GPU and CUDA installed.

After installation, you can start the server with:

```bash
yarn dev
```

If you want to run the server with access from other devices on the network, use
the `--host` flag:

```bash
yarn dev --host
```

## Feature Roadmap

- General
  - [ ] Better mobile support
  - [ ] Handle multiple connected clients (prevent stacking tagging requests)
  - [ ] Image grid layout
  - [x] Image sorting
  - [x] Image filtering
  - [ ] Recent Project menu
- Images
  - [x] Image upload
  - [x] Image cropping
  - [x] Image letter-boxing
  - [x] Filter images by tag
  - [x] Copy Image
  - [x] Move Image
  - [x] Delete Image
  - Cropping
    - [x] Cropping tool
    - [x] Fixed aspect ratios {1:1, 4:3, 3:4}
    - [x] Letter-boxing {1:1, 4:3, 3:4}
    - [ ] remove background
- Tagging
  - [x] Image auto-tagging
  - [ ] Individual Image tagging
  - [x] Bulk tagging (add/remove)
  - [ ] Recognition Model selection
  - [x] Model Tag automation
- Directories
  - [x] Image directory creation
  - [x] Image directory deletion
  - [ ] Image directory renaming
  - [ ] Image directory moving
  - [ ] Kohya project provisioning
    - [ ] Create project structure
    - [ ] Default config JSON
    - [ ] Image directory structure
    - [ ] Tag analytics
