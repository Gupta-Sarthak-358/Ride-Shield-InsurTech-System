#!/usr/bin/env node
/**
 * i18n Regression Guard
 * 
 * Checks for hardcoded user-facing strings in JSX files that should use t() translation.
 * 
 * Usage:
 *   node scripts/check-i18n.js
 *   node scripts/check-i18n.js --fix (interactive, shows files)
 * 
 * Add to package.json scripts:
 *   "check:i18n": "node scripts/check-i18n.js"
 * 
 * Add to pre-commit:
 *   npx simple-git-hooks add pre-commit "node scripts/check-i18n.js"
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { argv } from "process";

const SRC_DIR = new URL("../src", import.meta.url).pathname;
const FIX_MODE = argv.includes("--fix");

const EXEMPT_PATTERNS = [
  // Common safe patterns
  /^[\s\n]*$/,  // Empty/whitespace only
  /^[A-Z][a-zA-Z0-9_]*$/,  // PascalCase identifiers
  /^[a-z_][a-zA-Z0-9_]*$/,  // camelCase identifiers
  /^-+$/,  // Dash separators
  /^\d+(\.\d+)?$/,  // Numbers only
  /^v?\d+(\.\d+)*$/,  // Version numbers
  
  // Brand/technical terms (allowed hardcoded)
  /^(RideShield|Parametric|RideShield AI)$/i,
  /^(INR|Rs\.?)$/i,
  /^(km\/h|kmh|kg|hrs?|hours?|days?|weeks?)$/i,
  
  // Common technical strings
  /^(Loading|Error|Success|Warning|Info)$/i,
  /^(none|null|undefined)$/i,
  
  // Date/time formats
  /^\d{4}-\d{2}-\d{2}/,  // ISO dates
  /^\d{1,2}:\d{2}/,  // Time
  
  // URLs and paths
  /^https?:\/\//,
  /^\//,
  /^\.\//,
];

const EXEMPT_FILES = [
  "node_modules",
  "dist",
  "coverage",
  ".git",
  ".test.",
  ".spec.",
  "stories.js",
  "stories.jsx",
  "mock",
  "__tests__",
];

const JSX_EXTENSIONS = [".jsx", ".js"];

function shouldExempt(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 2) return true;
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function findJsxFiles(dir, files = []) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (!EXEMPT_FILES.some((exempt) => entry.includes(exempt))) {
            findJsxFiles(fullPath, files);
          }
        } else if (JSX_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
          files.push(fullPath);
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return files;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const issues = [];
  
  // Regex to find JSX text content
  // Matches: >Some Text< or >Some Text </Tag> or text in curly braces after >
  const textContentRegex = />\s*([^{}<>][^{}<>]{2,})\s*</g;
  
  let match;
  while ((match = textContentRegex.exec(content)) !== null) {
    const text = match[1];
    const lineNumber = content.substring(0, match.index).split("\n").length;
    
    if (!shouldExempt(text)) {
      // Check if it's wrapped in t() or interpolation
      const beforeText = content.substring(Math.max(0, match.index - 100), match.index);
      const afterText = content.substring(match.index + match[0].length, match.index + match[0].length + 50);
      
      const hasTranslation = /t\s*\(["'`]|t\(`.+`\)/.test(beforeText + afterText);
      const hasInterpolation = /\{[^}]+\}/.test(text);
      
      if (!hasTranslation && !hasInterpolation && !text.includes("$")) {
        issues.push({
          line: lineNumber,
          text: text.substring(0, 60) + (text.length > 60 ? "..." : ""),
        });
      }
    }
  }
  
  return issues;
}

function main() {
  console.log("🔍 Checking for hardcoded strings in JSX files...\n");
  
  const files = findJsxFiles(SRC_DIR);
  let totalIssues = 0;
  const filesWithIssues = [];
  
  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      filesWithIssues.push({ file: relative(SRC_DIR, file), issues });
    }
  }
  
  if (totalIssues === 0) {
    console.log("✅ No hardcoded strings detected!");
    console.log("   All user-facing text appears to use translation functions.\n");
    return 0;
  }
  
  console.log(`⚠️  Found ${totalIssues} potential hardcoded string${totalIssues === 1 ? "" : "s"} in ${filesWithIssues.length} file${filesWithIssues.length === 1 ? "" : "s"}:\n`);
  
  for (const { file, issues } of filesWithIssues) {
    console.log(`📄 ${file}`);
    for (const issue of issues.slice(0, 5)) {
      console.log(`   Line ${issue.line}: "${issue.text}"`);
    }
    if (issues.length > 5) {
      console.log(`   ... and ${issues.length - 5} more`);
    }
    console.log("");
  }
  
  if (!FIX_MODE) {
    console.log("💡 Run with --fix to see full details, or review manually.");
    console.log("   Consider wrapping user-facing strings in t() translation function.\n");
  }
  
  return 1;
}

const exitCode = main();
process.exit(exitCode);
