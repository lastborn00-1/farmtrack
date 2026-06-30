const fs = require('fs');
const path = require('path');

// Find all hook files recursively
function getFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('src/features');

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix pattern: onError: (error: any, variables, context: any) => {
  // toast.error(error.message || '...')
  // This got renamed to _error but toast still uses error.message
  // Restore: rename _error back to error, but rename unused 'error' param to _error
  // The real fix is: where we use error.message in toast, keep 'error' as param name
  // So let's revert _error.message back to error.message but also fix the param declaration
  
  // Fix 1: revert `_error.message` back to `error.message`
  if (content.includes('_error.message')) {
    content = content.replace(/_error\.message/g, 'error.message');
    modified = true;
  }
  
  // Fix 2: for onError handlers where error IS used in toast.error(error.message...),
  // prefix unused 'variables' param only
  // Pattern: onError: (_error: any, _variables: any, context: any)
  // The _error was renamed but we use error.message, so rename back
  if (content.includes('onError: (_error: any, _variables: any, context: any)')) {
    // Check if this block uses error.message
    content = content.replace(/onError: \(_error: any, _variables: any, context: any\)/g, 
      'onError: (error: any, _variables: any, context: any)');
    modified = true;
  }

  // Fix 3: For existing onError handlers (non-optimistic, pre-existing) 
  // where error param is used but was accidentally renamed to _error
  // These are: onError: (error: any) => { toast.error(error.message...
  // The script renamed 'error' to '_error' but code still refs 'error'
  // Pattern: `onError: (_error: any) =>` followed by `error.message`
  const singleErrorPattern = /onError: \(_error: any\) => \{\n\s+toast\.error\(error\.message/g;
  if (singleErrorPattern.test(content)) {
    content = content.replace(/onError: \(_error: any\) => \{(\n\s+toast\.error\(error\.message)/g, 
      'onError: (error: any) => {$1');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', filePath);
  }
}

console.log('Done!');
