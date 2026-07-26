import fs from 'fs';
let code = fs.readFileSync('src/services/api.ts', 'utf8');

// Replace all occurrences of 'users' in doc and collection calls
code = code.replace(/doc\(db,\s*'users'/g, "doc(db, getCollectionName('users')");
code = code.replace(/collection\(db,\s*'users'/g, "collection(db, getCollectionName('users')");

fs.writeFileSync('src/services/api.ts', code);
