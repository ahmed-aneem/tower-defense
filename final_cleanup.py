import re

# 1. GameEngine.ts: Remove unused properties and fix InputManager init
with open('src/game/GameEngine.ts', 'r') as f:
    ge_content = f.read()

ge_content = re.sub(r'private spawnTimer: number = 0;\s+', '', ge_content)
ge_content = re.sub(r'private enemiesToSpawn: EnemyType\[\] = \[\];\s+', '', ge_content)
ge_content = ge_content.replace('new InputManager(this.canvas)', 'new InputManager()')

with open('src/game/GameEngine.ts', 'w') as f:
    f.write(ge_content)

# 2. InputManager.ts: Remove canvas from constructor
with open('src/game/systems/InputManager.ts', 'r') as f:
    im_content = f.read()

# Change constructor(canvas: HTMLCanvasElement) to constructor()
im_content = re.sub(r'constructor\(canvas: HTMLCanvasElement\)', 'constructor()', im_content)
# Remove the commented out line I added before to be clean
im_content = im_content.replace('// this.canvas = canvas;', '')

with open('src/game/systems/InputManager.ts', 'w') as f:
    f.write(im_content)
