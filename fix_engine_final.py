import re

file_path = 'src/game/GameEngine.ts'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix Enemy Constructor
# Current incorrect in file: const enemy = new Enemy(this.path[0], newEnemyType, this.path);
# Desired:
# const enemy = new Enemy(newEnemyType, this.path[0]);
# enemy.setPath(this.path);
# this.enemies.push(enemy);

old_inst = r'const enemy = new Enemy\(this\.path\[0\], newEnemyType, this\.path\);\s+this\.enemies\.push\(enemy\);'
new_inst = 'const enemy = new Enemy(newEnemyType, this.path[0]);\n             enemy.setPath(this.path);\n             this.enemies.push(enemy);'
content = re.sub(old_inst, new_inst, content)

# 2. Add applyEndOfWaveMods to completion check
# Looking for:
# if (this.waveManager.checkWaveCompletion(this.enemies.length)) {
#     this.state.waveActive = false;
#     if (this.state.autoStart) {

target_str = 'this.state.waveActive = false;\n            if (this.state.autoStart) {'
replacement_str = 'this.state.waveActive = false;\n            this.applyEndOfWaveMods();\n            if (this.state.autoStart) {'
content = content.replace(target_str, replacement_str)

# 3. Remove Old Spawning Block
# It starts with: // Spawning
# It ends with: this.applyEndOfWaveMods(); inside the else block.
# And the closing brace of the outer if.

# Let's match roughly:
# // Spawning\s+if \(this\.state\.waveActive\) \{[\s\S]*?this\.applyEndOfWaveMods\(\);\s+\}

pattern = r'// Spawning\s+if \(this\.state\.waveActive\) \{[\s\S]*?this\.applyEndOfWaveMods\(\);\s+^\s+\}'
# Note: Using ^\s+\} to match the closing brace on a new line.
# Depending on formatting, this might be fragile.
# Let's try to match until "this.applyEndOfWaveMods();" and then two closing braces.

pattern = r'// Spawning\s+if \(this\.state\.waveActive\) \{[\s\S]*?this\.applyEndOfWaveMods\(\);\s+\}\s+\}'

# Check if we find it.
match = re.search(pattern, content)
if match:
    print("Found old spawning block. Removing.")
    content = content.replace(match.group(0), '')
else:
    print("Could not find old spawning block with regex. Trying alternative.")
    # Fallback: Maybe indentation is different.
    # tailored for the specific content we saw earlier.
    pass

with open(file_path, 'w') as f:
    f.write(content)
