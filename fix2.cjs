const fs = require('fs');

const hooksDir = 'src/features';
const dirs = fs.readdirSync(hooksDir);

dirs.forEach(dir => {
  const hookPath = `${hooksDir}/${dir}/hooks`;
  if (fs.existsSync(hookPath)) {
    const files = fs.readdirSync(hookPath);
    files.forEach(file => {
      if (file.endsWith('.ts')) {
        const fullPath = `${hookPath}/${file}`;
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/error\.message/g, '_error.message');
        fs.writeFileSync(fullPath, content);
      }
    });
  }
});
