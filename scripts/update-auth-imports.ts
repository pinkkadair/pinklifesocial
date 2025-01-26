import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const updateImports = (content: string): string => {
  return content
    // Update getServerSession import
    .replace(
      /import\s*{\s*getServerSession\s*}\s*from\s*["']next-auth["']/g,
      'import { auth } from "@/lib/auth"'
    )
    // Update authOptions import
    .replace(
      /import\s*{\s*authOptions\s*}\s*from\s*["']@\/lib\/auth["']/g,
      '// Removed authOptions import - using auth() directly'
    )
    // Replace getServerSession calls with auth()
    .replace(/await\s+getServerSession\s*\(\s*authOptions\s*\)/g, 'await auth()')
    .replace(/await\s+getServerSession\s*\(\s*\)/g, 'await auth()');
};

const updateFiles = async () => {
  const files = await glob('src/**/*.{ts,tsx}');
  
  files.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const updatedContent = updateImports(content);
    
    if (content !== updatedContent) {
      console.log(`Updating ${file}`);
      writeFileSync(file, updatedContent);
    }
  });
};

updateFiles().catch(console.error); 