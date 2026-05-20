import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');

const replacements = [
  // Typography
  [/text-slate-50\b/g, 'text-slate-900'],
  [/text-slate-100\b/g, 'text-slate-900'],
  [/text-white\b/g, 'text-slate-900'],
  [/text-slate-200\b/g, 'text-slate-800'],
  [/text-slate-300\b/g, 'text-slate-600'],
  [/text-slate-400\b/g, 'text-slate-500'],
  // Leave text-slate-500 as is, it works for both.
  
  // Specific Button texts
  [/text-slate-950\b/g, 'text-white'], 

  // Complex AppShell fixes (must run before generic ones)
  [/'bg-cyan-500 text-slate-950'/g, "'bg-cyan-50 text-cyan-700 font-medium'"],
  [/'text-slate-300 hover:bg-slate-800 hover:text-white'/g, "'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"],
  [/border-r border-slate-800 bg-slate-900\/80/g, "border-r border-slate-200 bg-white"],
  [/border border-slate-800 bg-slate-900\/70/g, "border border-slate-200 bg-white shadow-sm"],
  
  // Specific fix for PageCard shadow
  [/shadow-slate-950\/20\b/g, 'shadow-slate-200/50'],

  // Specific fix for inputs
  [/bg-slate-950 px-4 py-3 outline-none/g, 'bg-white px-4 py-3 outline-none focus:ring-1 focus:ring-cyan-600'],

  // Specific check for StatusBadge DRAFT and NOT_SCHEDULED
  [/'border-slate-700 bg-slate-900\/70 text-slate-200'/g, "'border-slate-200 bg-slate-100 text-slate-700'"],

  // Backgrounds
  [/bg-slate-950\/30/g, 'bg-slate-50'],
  [/bg-slate-950\/40/g, 'bg-slate-100'],
  [/bg-slate-900\/50/g, 'bg-white'],
  [/bg-slate-900\/70/g, 'bg-white'],
  [/bg-slate-900\/80/g, 'bg-white'],
  [/bg-slate-950\b/g, 'bg-slate-50'], 
  [/bg-slate-900\b/g, 'bg-white'],
  [/bg-slate-800\b/g, 'bg-slate-100'],
  
  // Hover backgrounds
  [/hover:bg-slate-800\b/g, 'hover:bg-slate-100'],
  [/hover:bg-slate-900\/40\b/g, 'hover:bg-slate-50'],

  // Borders
  [/border-slate-800\b/g, 'border-slate-200'],
  [/border-slate-700\b/g, 'border-slate-300'],
  [/border-slate-600\b/g, 'border-slate-400'],
  [/hover:border-slate-700\b/g, 'hover:border-slate-300'],
  [/hover:border-slate-500\b/g, 'hover:border-slate-400'],

  // Cyan Primary Accents
  [/bg-cyan-400\b/g, 'bg-cyan-600'],
  [/hover:bg-cyan-300\b/g, 'hover:bg-cyan-700'],
  [/text-cyan-400\b/g, 'text-cyan-600'],
  [/focus:border-cyan-400\b/g, 'focus:border-cyan-600'],
  [/border-cyan-400\b/g, 'border-cyan-500'],
  [/hover:bg-cyan-900\/40/g, 'hover:bg-cyan-50'],

  // Badges / Alerts / Accents (Cyan)
  [/bg-cyan-950\/40\b/g, 'bg-cyan-50'],
  [/bg-cyan-950\/20\b/g, 'bg-cyan-50'],
  [/border-cyan-700\b/g, 'border-cyan-200'],
  [/text-cyan-200\b/g, 'text-cyan-700'],

  // Badges / Alerts / Accents (Emerald)
  [/bg-emerald-950\/40\b/g, 'bg-emerald-50'],
  [/bg-emerald-950\/30\b/g, 'bg-emerald-50'],
  [/hover:bg-emerald-950\/30/g, 'hover:bg-emerald-100'],
  [/border-emerald-700\b/g, 'border-emerald-200'],
  [/text-emerald-200\b/g, 'text-emerald-700'],
  [/bg-emerald-400\b/g, 'bg-emerald-600'],
  [/hover:bg-emerald-300\b/g, 'hover:bg-emerald-700'],
  [/text-emerald-400\b/g, 'text-emerald-600'],

  // Badges / Alerts / Accents (Amber)
  [/bg-amber-950\/40\b/g, 'bg-amber-50'],
  [/bg-amber-950\/30\b/g, 'bg-amber-50'],
  [/bg-amber-950\/20\b/g, 'bg-amber-50'],
  [/hover:bg-amber-950\/30/g, 'hover:bg-amber-100'],
  [/border-amber-800\b/g, 'border-amber-200'],
  [/border-amber-700\b/g, 'border-amber-200'],
  [/text-amber-200\b/g, 'text-amber-700'],
  [/text-amber-300\b/g, 'text-amber-600'],

  // Badges / Alerts / Accents (Rose)
  [/bg-rose-950\/40\b/g, 'bg-rose-50'],
  [/bg-rose-950\/30\b/g, 'bg-rose-50'],
  [/hover:bg-rose-950\/30/g, 'hover:bg-rose-100'],
  [/border-rose-700\b/g, 'border-rose-200'],
  [/text-rose-200\b/g, 'text-rose-700'],
  [/text-rose-400\b/g, 'text-rose-600'], 
  [/bg-rose-400\b/g, 'bg-rose-600'],
  [/hover:bg-rose-300\b/g, 'hover:bg-rose-700'],

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
console.log('V2 Migration complete.');
