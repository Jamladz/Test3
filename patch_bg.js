import fs from 'fs';
let code = fs.readFileSync('src/pages/Game.tsx', 'utf8');

code = code.replace(
  '  return (\n    <div \n      className="flex flex-col items-center flex-1 w-full px-4 pt-0 pb-1 relative select-none min-h-0 overflow-y-auto no-scrollbar"\n      style={{\n        backgroundImage: \'url("https://i.suar.me/3zzxd/l")\',\n        backgroundSize: \'cover\',\n        backgroundPosition: \'center -140px\',\n        backgroundRepeat: \'no-repeat\'\n      }}\n    >\n      <div className="absolute inset-0 bg-black/30 w-full h-full pointer-events-none z-0" />',
  `  return (\n    <div className="flex flex-col items-center flex-1 w-full px-4 pt-0 pb-1 relative select-none min-h-0 overflow-y-auto no-scrollbar">\n      <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000" style={{\n        backgroundImage: 'url("https://i.suar.me/3zzxd/l")',\n        backgroundSize: 'cover',\n        backgroundPosition: 'center -140px',\n        backgroundRepeat: 'no-repeat',\n        ...(currentSeason === 2 ? { filter: 'hue-rotate(180deg) saturate(1.5)' } : {})\n      }} />\n      <div className="absolute inset-0 bg-black/30 w-full h-full pointer-events-none z-0" />`
);

fs.writeFileSync('src/pages/Game.tsx', code);
