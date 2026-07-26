import fs from 'fs';
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');
code = code.replace(
  '<div className="flex justify-end gap-2 items-center scale-[0.85] origin-right ml-auto relative">\n          <div className="relative">',
  '<div className="flex justify-end gap-2 items-center scale-[0.85] origin-right ml-auto relative">\n          <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">\n            <Settings size={20} className="text-white" />\n          </button>\n          <div className="relative">'
);
fs.writeFileSync('src/components/Header.tsx', code);
