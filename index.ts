/**
 * Main entry point for TypeDoc RAG Extractor
 * Exports public API
 */

export { extractAllDocumentation } from "./extractor.js";
export { TypeDocProcessor, processTypedoc } from "./processor.js";
export { typeToString } from "./type-converter.js";
export { extractCommentParts, extractCodeBlocks } from "./comment-parser.js";
export {
  buildSignatureString,
  buildTypeParameterString,
  buildParameterString,
} from "./signature-builder.js";

export type {
  ExtractedDocumentation,
  DocumentationDetail,
  TypeInformation,
  SignatureDetail,
  ParameterDetail,
  TagsDetail,
  HierarchyDetail,
  SourceInfo,
  ModifiersDetail,
  ExampleDetail,
  ReturnTagDetail,
  ParamTagDetail,
  TypeParamTagDetail,
  TypeParameterDetail,
} from "./types.js";
