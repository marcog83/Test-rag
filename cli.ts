#!/usr/bin/env node

/**
 * CLI interface for TypeDoc RAG Extractor
 * Allows running extraction from command line
 */

import { processTypedoc } from "./processor.js";
import * as fs from "fs";

function printUsage(): void {
  console.log(`
TypeDoc RAG Extractor
=====================

Usage:
  typedoc-rag-extractor <input.json> [options]

Arguments:
  <input.json>          Path to TypeDoc JSON file

Options:
  -o, --output <path>   Output directory (default: ./extracted-docs)
  --raw                 Include raw JSON in output
  --compact             Minify JSON output
  -h, --help            Show this help message

Examples:
  typedoc-rag-extractor docs.json
  typedoc-rag-extractor docs.json -o ./rag-output --raw
  `);
}

function parseArgs(): any {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printUsage();
    process.exit(0);
  }
  
  const inputPath = args[0];
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: File not found: ${inputPath}`);
    process.exit(1);
  }
  
  const options: any = {
    inputPath,
    outputPath: "./extracted-docs",
    includeRawJSON: false,
    pretty: true,
  };
  
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "-o":
      case "--output":
        options.outputPath = args[++i];
        break;
      case "--raw":
        options.includeRawJSON = true;
        break;
      case "--compact":
        options.pretty = false;
        break;
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log(`
╔════════════════════════════════════════╗
║   TypeDoc RAG Extractor                ║
║   Extracting complete API documentation║
╚════════════════════════════════════════╝
  `);
  
  try {
    processTypedoc(options);
    console.log(`
✨ Extraction completed successfully!
   Output directory: ${options.outputPath}
    `);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

main();
