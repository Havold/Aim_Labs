# Aim Labs 🔫 
# Three.js Game Project

This project is a 3D game developed using Three.js. It involves loading various 3D models, setting up a game environment, and handling user interactions.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Controls](#controls)
- [Dependencies](#dependencies)

## Installation

To set up the project, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/Havold/Aim_Labs.git
    cd Aim_Lab
    ```

2. Install the required dependencies:
    ```sh
    npm install
    ```

## Usage

To run the project, use the following command:
```sh
npx vite
```
This will start a local development server, and you can view the game in your browser.

## Features
- 3D Models: The game loads various 3D models using OBJ, MTL, and FBX loaders.
- Lighting: Directional and ambient lighting for realistic effects.
- Audio: Footstep and gunshot sounds for an immersive experience.
- UI Elements: Score, accuracy, and overlay screens.
- Pointer Lock Controls: For first-person shooter controls.
- Responsive Design: The canvas resizes to fit the window.

## Controls
- W: Move forward.
- S: Move backward.
- A: Move left.
- D: Move right.
- Space: Jump.
- Left Mouse Click: Shoot.

## Dependencies
- Three.js
- dat.GUI
- Tween.js
- Simples-noise
- PointerLockControls
- OBJLoader
- MTLLoader
- FBXLoader
