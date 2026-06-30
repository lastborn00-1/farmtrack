const fs = require('fs');
const glob = require('glob'); // Note: we might not have glob, just use raw fs

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
        content = content.replace(/onError: \(error: any, variables, context: any\)/g, 'onError: (_error: any, _variables: any, context: any)');
        fs.writeFileSync(fullPath, content);
      }
    });
  }
});
