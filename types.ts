/**
 * Type definitions for TypeDoc JSON extraction
 * Comprehensive interfaces for all extracted documentation metadata
 */

export interface ExtractedDocumentation {
  id: string;
  name: string;
  kind: string;
  fullPath: string;
  
  // Core documentation
  documentation: DocumentationDetail;
  
  // Complete type information
  types: TypeInformation;
  
  // Function/Method signatures
  signatures: SignatureDetail[];
  
  // Parameters
  parameters?: ParameterDetail[];
  
  // Special tags and metadata
  tags: TagsDetail;
  
  // Hierarchy and relationships
  hierarchy: HierarchyDetail;
  
  // Source code information
  source: SourceInfo;
  
  // Modifiers
  modifiers: ModifiersDetail;
  
  // Default values
  defaultValue?: string;
  
  // For indexing and searching
  searchTokens: string[];
  
  // Raw JSON for reference
  rawJSON: any;
}

export interface DocumentationDetail {
  summary: string;
  description: string;
  remarks?: string;
  deprecated?: {
    isDeprecated: boolean;
    message?: string;
  };
  license?: string;
  copyright?: string;
  author?: string[];
  since?: string;
}

export interface TypeInformation {
  type?: string;
  typeRaw: any;
  typeParameters?: TypeParameterDetail[];
  extendedTypes?: string[];
  implementedTypes?: string[];
}

export interface TypeParameterDetail {
  name: string;
  constraint?: TypeDefinition;
  default?: TypeDefinition;
  description?: string;
}

export interface TypeDefinition {
  type: string;
  typeRaw: any;
}

export interface SignatureDetail {
  name: string;
  kind: string;
  
  // Complete signature string
  signature: string;
  
  // Type parameters details
  typeParameters?: TypeParameterDetail[];
  
  // Parameters with full details
  parameters: ParameterDetail[];
  
  // Return type
  returnType: ReturnTypeDetail;
  
  // Inheritance info
  overwrites?: ReferenceDetail;
  inheritedFrom?: ReferenceDetail;
  implementationOf?: ReferenceDetail;
  
  documentation: SignatureDocumentation;
}

export interface ReturnTypeDetail {
  type: string;
  typeRaw: any;
  description?: string;
}

export interface ReferenceDetail {
  name: string;
  id: string;
}

export interface SignatureDocumentation {
  summary?: string;
  description?: string;
}

export interface ParameterDetail {
  name: string;
  kind: string;
  type: TypeDefinition;
  description?: string;
  isOptional: boolean;
  isRest: boolean;
  defaultValue?: string;
  tags?: ParameterTags;
}

export interface ParameterTags {
  description?: string;
  example?: string;
}

export interface TagsDetail {
  examples?: ExampleDetail[];
  examples_md?: string[];
  tutorials?: string[];
  seeTags?: string[];
  throwsTags?: string[];
  returnsTags?: ReturnTagDetail[];
  paramTags?: ParamTagDetail[];
  typeparamTags?: TypeParamTagDetail[];
  customTags?: Record<string, string[]>;
}

export interface ExampleDetail {
  text: string;
  isCode: boolean;
  language?: string;
  sourceFile?: string;
  lineNumber?: number;
}

export interface ReturnTagDetail {
  type?: string;
  typeRaw?: any;
  description: string;
}

export interface ParamTagDetail {
  paramName: string;
  type?: string;
  typeRaw?: any;
  description: string;
}

export interface TypeParamTagDetail {
  paramName: string;
  description: string;
}

export interface HierarchyDetail {
  parentId?: string;
  parentName?: string;
  parentKind?: string;
  childrenIds?: string[];
  moduleId?: string;
  moduleName?: string;
}

export interface SourceInfo {
  filename: string;
  lineStart?: number;
  lineEnd?: number;
  url?: string;
}

export interface ModifiersDetail {
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
}
