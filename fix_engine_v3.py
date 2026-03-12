import re

file_path = 'src/game/GameEngine.ts'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix Enemy Instantiation
# Current incorrect: const enemy = new Enemy(this.path[0], newEnemyType, this.path);
# Desired:
# const enemy = new Enemy(newEnemyType, this.path[0]);
# enemy.setPath(this.path);
# this.enemies.push(enemy);

old_inst = r'const enemy = new Enemy\(this\.path\[0\], newEnemyType, this\.path\);\s+this\.enemies\.push\(enemy\);'
new_inst = 'const enemy = new Enemy(newEnemyType, this.path[0]);\n             enemy.setPath(this.path);\n             this.enemies.push(enemy);'
content = re.sub(old_inst, new_inst, content)


# 2. Add applyEndOfWaveMods to completion check
# Current:
# if (this.waveManager.checkWaveCompletion(this.enemies.length)) {
#     this.state.waveActive = false;
#     if (this.state.autoStart) {
#          this.startWave();
#     }
# }

# Desired:
# if (this.waveManager.checkWaveCompletion(this.enemies.length)) {
#     this.state.waveActive = false;
#     this.applyEndOfWaveMods();  <-- Add this
#     if (this.state.autoStart) {
#          this.startWave();
#     }
# }

content = content.replace(
    'this.state.waveActive = false;\n            if (this.state.autoStart) {',
    'this.state.waveActive = false;\n            this.applyEndOfWaveMods();\n            if (this.state.autoStart) {'
)


# 3. Remove Old Spawning Block
# Pattern: // Spawning ... down to applyEndOfWaveMods call and closing brace?
# Let's be careful. The old block starts at .
# It ends with  inside  block.
# And closing brace for  block.
# Let's match from  to the end of that block.
# But regex matching nested braces is hard.
# However, we know it's inside .
# And we injected our new logic BEFORE it.
# So we can remove from  until  (assuming that's next).
# Or until .

# Let's find what follows the spawning block.
# Lines 435-460ish.
# Usually it's  or .
# Let's assume  comes after?
# Let's look at  to see what follows.
# Wait, I can't look now without another tool call.
# I'll rely on common sense.
# I'll replace  with nothing?
# No, that's risky.

# Alternative: Replace the specific known block structure.
# if (this.state.waveActive) { ... }
# I'll try to match a large chunk that looks like the old code.

old_block_start = r'// Spawning\s+if \(this\.state\.waveActive\) \{'
# Match until applyEndOfWaveMods and the closing braces.
old_block_end = r'this\.applyEndOfWaveMods\(\);\s+            \}\s+        \}'

# Try to remove it.
content = re.sub(old_block_start + r'[\s\S]*?' + old_block_end, '', content)


with open(file_path, 'w') as f:
    f.write(content)
