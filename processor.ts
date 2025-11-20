/**
 * Processes TypeDoc JSON and orchestrates the extraction
 * Handles file I/O and batch processing
 */

import * as fs from "fs";
import * as path from "path";
import { extractAllDocumentation } from "./extractor.js";
import type { ExtractedDocumentation } from "./types.js";

export interface ProcessorOptions {
  inputPath: string;
  outputPath: string;
  includeSources?: boolean;
  includeRawJSON?: boolean;
  pretty?: boolean;
  batchSize?: number;
}

export class TypeDocProcessor {
  private options: ProcessorOptions;
  private allDocs: ExtractedDocumentation[] = [];
  
  constructor(options: ProcessorOptions) {
    this.options = {
      includeSources: true,
      includeRawJSON: false,
      pretty: true,
      batchSize: 100,
      ...options,
    };
    
    this.ensureOutputDirectory();
  }
  
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.options.outputPath)) {
      fs.mkdirSync(this.options.outputPath, { recursive: true });
    }
  }
  
  public process(): void {
    console.log(`📖 Loading TypeDoc JSON from: ${this.options.inputPath}`);
    
    const typedocJson = this.loadJSON(this.options.inputPath);
    
    console.log(`⚙️  Processing ${typedocJson.children?.length || 0} root reflections...`);
    
    this.processReflections(typedocJson.children || [], typedocJson);
    
    console.log(`✅ Extracted ${this.allDocs.length} documentation entries`);
    
    this.saveResults(typedocJson);
  }
  
  private loadJSON(filePath: string): any {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Failed to load JSON from ${filePath}:`, error);
      throw error;
    }
  }
  
  private processReflections(
    reflections: any[],
    project: any,
    parentPath: string = ""
  ): void {
    for (const reflection of reflections) {
      try {
        const doc = extractAllDocumentation(reflection, project, parentPath);
        this.allDocs.push(doc);
        
        // Recursively process children
        if (reflection.children && reflection.children.length > 0) {
          this.processReflections(
            reflection.children,
            project,
            doc.fullPath
          );
        }
      } catch (error) {
        console.warn(
          `⚠️  Failed to extract documentation for ${reflection.name}:`,
          error
        );
      }
    }
  }
  
  private saveResults(project: any): void {
    // Save complete extracted documentation
    this.saveJSON("extracted-docs.json", this.allDocs);
    
    // Save metadata about the extraction
    this.saveJSON("extraction-metadata.json", {
      timestamp: new Date().toISOString(),
      totalEntries: this.allDocs.length,
      projectName: project.name,
      projectVersion: project.version,
    });
    
    // Save indexed entries for RAG (without raw JSON to save space)
    const ragIndex = this.allDocs.map((doc) => {
      const { rawJSON, ...rest } = doc;
      return rest;
    });
    this.saveJSON("rag-index.json", ragIndex);
    
    // Save search index
    const searchIndex = this.buildSearchIndex();
    this.saveJSON("search-index.json", searchIndex);
    
    console.log(`📁 Results saved to: ${this.options.outputPath}`);
  }
  
  private buildSearchIndex(): Record<string, any> {
    const index: Record<string, any> = {};
    
    for (const doc of this.allDocs) {
      // Index by ID
      index[`id:${doc.id}`] = {
        name: doc.name,
        kind: doc.kind,
        fullPath: doc.fullPath,
      };
      
      // Index by full path
      index[`path:${doc.fullPath}`] = doc.id;
      
      // Index by search tokens
      for (const token of doc.searchTokens) {
        const key = `token:${token.toLowerCase()}`;
        if (!index[key]) {
          index[key] = [];
        }
        index[key].push(doc.id);
      }
    }
    
    return index;
  }
  
  private saveJSON(filename: string, data: any): void {
    const filePath = path.join(this.options.outputPath, filename);
    const json = this.options.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    fs.writeFileSync(filePath, json, "utf-8");
    
    const size = (json.length / 1024 / 1024).toFixed(2);
    console.log(`  📄 ${filename} (${size} MB)`);
  }
}

export function processTypedoc(options: ProcessorOptions): void {
  const processor = new TypeDocProcessor(options);
  processor.process();
}
