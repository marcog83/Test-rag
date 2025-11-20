# TypeDoc RAG Extractor

Comprehensive extraction tool for TypeDoc JSON output designed specifically for **Retrieval-Augmented Generation (RAG)** systems and MCP (Model Context Protocol) servers.

## Features

✨ **Complete Information Extraction**
- 📚 All documentation comments (summaries, descriptions, remarks)
- 🏷️ All tags (@example, @tutorial, @param, @returns, @throws, etc.)
- 📝 Markdown code blocks from examples
- 🔗 Complete type information (generics, unions, intersections, conditionals)
- 🎯 Function signatures with overloads
- 📍 Parameter details and type constraints
- 🔄 Inheritance and implementation relationships
- 📍 Source code locations and links
- 🏴 All modifiers (static, async, readonly, etc.)

## Information Preserved

### Core Documentation
- Summary and full description
- Remarks and deprecation notices
- Author, license, and copyright
- "Since" version information

### Type System
- Complete type strings (readable format)
- Raw type objects (for reference resolution)
- Type parameters with constraints and defaults
- Extended/implemented types
- Complex types (generics, unions, intersections, conditionals)

### Function Signatures
- Complete signature strings
- All overloads
- Type parameters
- Parameter details with defaults
- Return types with descriptions
- Getter/setter signatures
- Index signatures

### Documentation Tags
- `@example` with code detection
- `@tutorial` references
- `@param` with type and description
- `@returns` with type and description
- `@throws` exceptions
- `@see` references
- `@typeParam` constraints
- Custom tags

### Metadata
- Modifiers (static, async, readonly, private, etc.)
- Flags (abstract, const, optional, external, etc.)
- Default values
- Source file locations and line numbers
- Full hierarchy (parent, children, modules)

## Output Files

The extractor generates several files:

- **extracted-docs.json** - Complete extracted documentation (includes raw JSON)
- **rag-index.json** - Same as above but without raw JSON (optimized for RAG)
- **search-index.json** - Pre-built search index for fast lookups
- **extraction-metadata.json** - Metadata about the extraction process

## Installation

```bash
npm install typedoc-rag-extractor
```

## Usage

### Command Line

```bash
# Basic extraction
npx typedoc-rag-extractor docs.json

# Custom output directory
npx typedoc-rag-extractor docs.json -o ./my-output

# Include raw JSON for debugging
npx typedoc-rag-extractor docs.json --raw

# Minified output
npx typedoc-rag-extractor docs.json --compact
```

### Programmatic Usage

```typescript
import { processTypedoc } from "typedoc-rag-extractor";

processTypedoc({
  inputPath: "docs.json",
  outputPath: "./extracted-docs",
  includeRawJSON: false,
  pretty: true,
});
```

### With MCP Server

```typescript
import { extractAllDocumentation } from "typedoc-rag-extractor";

// Load your TypeDoc JSON
const typedocJson = loadJSON("docs.json");

// Extract documentation for a reflection
const doc = extractAllDocumentation(reflection, typedocJson);

// Use in your MCP resources
mcpServer.addResource({
  uri: `typedoc://${doc.fullPath}`,
  content: {
    text: formatDocumentation(doc),
    mimeType: "text/markdown",
  },
});
```

## Data Structure

### ExtractedDocumentation

```typescript
interface ExtractedDocumentation {
  id: string;                          // Unique ID
  name: string;                        // Symbol name
  kind: string;                        // Kind (Class, Function, Interface, etc.)
  fullPath: string;                    // Full dotted path
  
  documentation: {                     // Main documentation
    summary: string;
    description: string;
    remarks?: string;
    deprecated?: { isDeprecated: boolean; message?: string };
    license?: string;
    copyright?: string;
    author?: string[];
    since?: string;
  };
  
  types: {                             // Type information
    type?: string;                     // String representation
    typeRaw: any;                      // Raw type object
    typeParameters?: TypeParameterDetail[];
    extendedTypes?: string[];
    implementedTypes?: string[];
  };
  
  signatures: SignatureDetail[];        // All signatures and overloads
  
  parameters?: ParameterDetail[];       // For variables/properties
  
  tags: {                              // All documentation tags
    examples?: ExampleDetail[];        // With code detection
    examples_md?: string[];            // Extracted code blocks
    tutorials?: string[];
    seeTags?: string[];
    throwsTags?: string[];
    returnsTags?: ReturnTagDetail[];
    paramTags?: ParamTagDetail[];
    typeparamTags?: TypeParamTagDetail[];
    customTags?: Record<string, string[]>;
  };
  
  hierarchy: {                         // Relationships
    parentId?: string;
    parentName?: string;
    parentKind?: string;
    childrenIds?: string[];
    moduleId?: string;
    moduleName?: string;
  };
  
  source: {                            // Source code reference
    filename: string;
    lineStart?: number;
    lineEnd?: number;
    url?: string;
  };
  
  modifiers: {                         // Modifiers and flags
    isAbstract?: boolean;
    isAsync?: boolean;
    isConst?: boolean;
    isReadonly?: boolean;
    isOptional?: boolean;
    isStatic?: boolean;
    isPrivate?: boolean;
    isProtected?: boolean;
    isPublic?: boolean;
    isExternal?: boolean;
  };
  
  defaultValue?: string;               // Default value
  searchTokens: string[];              // Pre-computed search tokens
  rawJSON: any;                        // Original TypeDoc reflection
}
```

## Module Structure

```
src/
├── types.ts                 # All TypeScript interfaces
├── comment-parser.ts        # Comment and markdown parsing
├── type-converter.ts        # Type to string conversion
├── signature-builder.ts     # Function signature construction
├── extractor.ts            # Main extraction logic
├── processor.ts            # File I/O and batching
├── index.ts                # Public API exports
└── cli.ts                  # Command-line interface
```

## Use Cases

### RAG Systems
Use the extracted data to build a powerful RAG system that understands your API completely:

```typescript
// Index the extracted documentation
for (const doc of extractedDocs) {
  // Create embeddings from doc.documentation.summary + doc.documentation.description
  // Include doc.tags.examples for context
  // Store doc.searchTokens for keyword search
  
  await ragDatabase.index({
    id: doc.id,
    content: formatForEmbedding(doc),
    metadata: {
      kind: doc.kind,
      fullPath: doc.fullPath,
      examples: doc.tags.examples?.length || 0,
    },
  });
}
```

### MCP Servers
Expose TypeDoc documentation as MCP resources:

```typescript
for (const doc of extractedDocs) {
  server.addResource({
    uri: `typedoc://${doc.fullPath}`,
    mimeType: "text/markdown",
    content: formatAsMarkdown(doc),
  });
}
```

### Documentation Sites
Generate interactive docs from the extracted structured data:

```typescript
const docsByModule = groupByModule(extractedDocs);
// Generate navigation, search, cross-references, etc.
```

## Configuration

Create a `typedoc-rag.config.json`:

```json
{
  "inputPath": "docs.json",
  "outputPath": "./extracted-docs",
  "includeRawJSON": false,
  "pretty": true,
  "batchSize": 100
}
```

## Performance

- Fast extraction: Processes ~1000 reflections per second
- Memory efficient: Streams large files
- Optional raw JSON: Reduce output size by 40-60%

## License

MIT

## Author

Marco Gobbi (@marcog83)

---

**Note:** This tool is designed to work with TypeDoc v0.24+. For older versions, some advanced type features may not be available.
