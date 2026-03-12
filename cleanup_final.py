import re

# 1. Clean GameEngine.ts
file_path = 'src/game/GameEngine.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Exact text matching for the block to remove
block_to_remove = """        // Spawning
        if (this.state.waveActive) {
            if (this.enemiesToSpawn.length > 0) {
                this.spawnTimer++;
                if (this.spawnTimer > 60) {
                    const type = this.enemiesToSpawn.shift()!;
                    // Pass path to enemy
                    const enemy = new Enemy(type);
                    enemy.setPath(this.path); // Enemy needs to know path!
                    this.enemies.push(enemy);
                    this.spawnTimer = 0;
                }
            } else if (this.enemies.length === 0) {
                // Wave complete
                this.state.waveActive = false;

                // Apply End of Wave Mods
                this.applyEndOfWaveMods();

                this.state.wave++;
                this.notifyState();
            }
        }"""

if block_to_remove in content:
    content = content.replace(block_to_remove, '')
    print("Successfully removed old spawning block.")
else:
    print("Could not find exact block match. Check whitespace.")
    # Try normalizing whitespace if needed, but let's hope it matches exactly since I copied from sed output.
    # Actually, sed output might have different indentation or line endings?
    # I'll try to match loosely if exact fails.

with open(file_path, 'w') as f:
    f.write(content)

# 2. Clean InputManager.ts
input_path = 'src/game/systems/InputManager.ts'
with open(input_path, 'r') as f:
    input_content = f.read()

# Remove 'private canvas: HTMLCanvasElement;'
input_content = input_content.replace('private canvas: HTMLCanvasElement;', '// private canvas: HTMLCanvasElement; // Removed unused')
# Remove constructor assignment
input_content = input_content.replace('this.canvas = canvas;', '// this.canvas = canvas;')

with open(input_path, 'w') as f:
    f.write(input_content)
