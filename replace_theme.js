import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');

const replacements = [
  // BGs
  [/bg-slate-950\/(\d+)/g, 'bg-white/$1'],
  [/bg-slate-950/g, 'bg-white'],
  [/bg-slate-900\/(\d+)/g, 'bg-slate-50/$1'],
  [/bg-slate-900/g, 'bg-slate-50'],
  [/bg-slate-800\/(\d+)/g, 'bg-slate-100/$1'],
  [/bg-slate-800/g, 'bg-slate-100'],
  
  // Borders
  [/border-slate-800/g, 'border-slate-200'],
  [/border-slate-700/g, 'border-slate-300'],
  
  // Texts
  [/text-slate-100/g, 'text-slate-900'],
  [/text-slate-200/g, 'text-slate-800'],
  [/text-slate-300/g, 'text-slate-700'],
  [/text-slate-400/g, 'text-slate-600'],
  [/text-slate-500/g, 'text-slate-500'],
  [/text-slate-950/g, 'text-white'],
  
  // Accents (Cyan)
  [/bg-cyan-400/g, 'bg-cyan-600'],
  [/hover:bg-cyan-300/g, 'hover:bg-cyan-700'],
  [/text-cyan-400/g, 'text-cyan-600'],
  [/focus:border-cyan-400/g, 'focus:border-cyan-500'],
  [/border-cyan-400/g, 'border-cyan-500'],
  [/bg-cyan-950\/20/g, 'bg-cyan-50'],
  [/text-cyan-100/g, 'text-cyan-900'],
  [/text-cyan-200/g, 'text-cyan-800'],
  [/border-cyan-700/g, 'border-cyan-300'],
  [/bg-cyan-950\/30/g, 'bg-cyan-100'],
  [/hover:bg-cyan-900\/40/g, 'hover:bg-cyan-100'],

  // Accents (Emerald)
  [/bg-emerald-400/g, 'bg-emerald-600'],
  [/hover:bg-emerald-300/g, 'hover:bg-emerald-700'],
  [/text-emerald-400/g, 'text-emerald-600'],
  [/text-emerald-200/g, 'text-emerald-800'],
  [/border-emerald-700/g, 'border-emerald-300'],
  [/bg-emerald-950\/30/g, 'bg-emerald-100'],
  [/hover:bg-emerald-950\/30/g, 'hover:bg-emerald-100'],

  // Accents (Amber)
  [/text-amber-200/g, 'text-amber-800'],
  [/border-amber-800/g, 'border-amber-200'],
  [/bg-amber-950\/20/g, 'bg-amber-50'],
  [/border-amber-700/g, 'border-amber-300'],
  [/bg-amber-950\/30/g, 'bg-amber-100'],
  [/hover:bg-amber-950\/30/g, 'hover:bg-amber-100'],

  // Accents (Rose)
  [/text-rose-200/g, 'text-rose-800'],
  [/text-rose-400/g, 'text-rose-600'],
  [/bg-rose-400/g, 'bg-rose-600'],
  [/hover:bg-rose-300/g, 'hover:bg-rose-700'],
  [/border-rose-700/g, 'border-rose-300'],
  [/bg-rose-950\/30/g, 'bg-rose-100'],
  [/hover:bg-rose-950\/30/g, 'hover:bg-rose-100'],

  // Generic hovers for borders
  [/hover:border-slate-500/g, 'hover:border-slate-400'],
  [/hover:border-slate-700/g, 'hover:border-slate-400'],

  // Bg hover
  [/hover:bg-slate-800/g, 'hover:bg-slate-200'],
  [/hover:bg-slate-900\/40/g, 'hover:bg-slate-100'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

processDirectory(SRC_DIR);
console.log('Migration complete.');
