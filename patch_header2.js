import fs from 'fs';
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');
code = code.replace(
  '<div className="flex justify-end gap-2 items-center scale-[0.85] origin-right ml-auto relative">',
  '<div className="flex justify-end gap-2 items-center ml-auto relative z-50">'
);
code = code.replace(
  '<div className="flex justify-between items-center w-full">',
  '<div className="flex justify-between items-start w-full">'
);
fs.writeFileSync('src/components/Header.tsx', code);
