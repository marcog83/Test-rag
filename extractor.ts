/**
 * Main extraction logic for TypeDoc JSON
 * Orchestrates all sub-modules to extract complete documentation
 */

import { typeToString } from "./type-converter.js";
import { extractCommentParts, extractAuthorTags, extractCodeBlocks, isCodeExample, detectLanguage } from "./comment-parser.js";
import { buildSignatureString, buildTypeParameterString, buildParameterString, buildGetSetSignature, buildIndexSignatureString } from "./signature-builder.js";
import type {
  ExtractedDocumentation,
  DocumentationDetail,
  TypeInformation,
  SignatureDetail,
  ParameterDetail,
  TagsDetail,
  HierarchyDetail,
  ModifiersDetail,
  SourceInfo,
  TypeParameterDetail,
} from "./types.js";

export function extractAllDocumentation(
  reflection: any,
  project: any,
  path: string = ""
): ExtractedDocumentation {
  const fullPath = path ? `${path}.${reflection.name}` : reflection.name;
  
  return {
    id: reflection.id.toString(),
    name: reflection.name,
    kind: reflection.kind,
    fullPath,
    
    documentation: extractDocumentation(reflection),
    types: extractTypeInformation(reflection, project),
    signatures: extractSignatures(reflection, project),
    parameters: extractParameters(reflection),
    tags: extractAllTags(reflection),
    hierarchy: extractHierarchy(reflection, project),
    source: extractSourceInfo(reflection),
    modifiers: extractModifiers(reflection),
    defaultValue: reflection.defaultValue,
    searchTokens: generateSearchTokens(reflection, fullPath),
    rawJSON: reflection,
  };
}

function extractDocumentation(reflection: any): DocumentationDetail {
  const comment = reflection.comment || {};
  
  return {
    summary: extractCommentParts(comment.summary),
    description: extractCommentParts(comment.description),
    remarks: extractCommentParts(comment.remarks),
    deprecated: {
      isDeprecated: reflection.flags?.isDeprecated || false,
      message: comment.deprecated 
        ? extractCommentParts(comment.deprecated) 
        : undefined,
    },
    license: comment.license ? extractCommentParts(comment.license) : undefined,
    copyright: comment.copyright ? extractCommentParts(comment.copyright) : undefined,
    author: extractAuthorTags(comment),
    since: comment.since ? extractCommentParts(comment.since) : undefined,
  };
}

function extractTypeInformation(reflection: any, project: any): TypeInformation {
  return {
    type: reflection.type ? typeToString(reflection.type, project) : undefined,
    typeRaw: reflection.type,
    typeParameters: extractTypeParameters(reflection.typeParameters),
    extendedTypes: reflection.extendedTypes?.map((t: any) =>
      typeToString(t, project)
    ),
    implementedTypes: reflection.implementedTypes?.map((t: any) =>
      typeToString(t, project)
    ),
  };
}

function extractTypeParameters(typeParams?: any[]): TypeParameterDetail[] {
  if (!typeParams) return [];
  
  return typeParams.map((tp) => ({
    name: tp.name,
    constraint: tp.type
      ? {
          type: typeToString(tp.type, tp),
          typeRaw: tp.type,
        }
      : undefined,
    default: tp.default
      ? {
          type: typeToString(tp.default, tp),
          typeRaw: tp.default,
        }
      : undefined,
    description: tp.comment?.summary
      ? extractCommentParts(tp.comment.summary)
      : undefined,
  }));
}

function extractSignatures(reflection: any, project: any): SignatureDetail[] {
  const signatures: SignatureDetail[] = [];
  
  // Handle multiple signatures (overloads)
  if (reflection.signatures) {
    for (const sig of reflection.signatures) {
      signatures.push({
        name: sig.name,
        kind: sig.kind,
        signature: buildSignatureString(reflection, sig, project),
        typeParameters: extractTypeParameters(sig.typeParameters),
        parameters: extractParameters(sig),
        returnType: {
          type: sig.type ? typeToString(sig.type, project) : "void",
          typeRaw: sig.type,
          description: sig.comment?.summary
            ? extractCommentParts(sig.comment.summary)
            : undefined,
        },
        overwrites: sig.overwrites
          ? {
              name: resolveTypeName(sig.overwrites, project),
              id: sig.overwrites.id?.toString(),
            }
          : undefined,
        inheritedFrom: sig.inheritedFrom
          ? {
              name: resolveTypeName(sig.inheritedFrom, project),
              id: sig.inheritedFrom.id?.toString(),
            }
          : undefined,
        implementationOf: sig.implementationOf
          ? {
              name: resolveTypeName(sig.implementationOf, project),
              id: sig.implementationOf.id?.toString(),
            }
          : undefined,
        documentation: {
          summary: sig.comment?.summary
            ? extractCommentParts(sig.comment.summary)
            : undefined,
          description: sig.comment?.description
            ? extractCommentParts(sig.comment.description)
            : undefined,
        },
      });
    }
  }
  
  // Handle get/set signatures
  if (reflection.getSignature) {
    signatures.push(buildGetSetSignature(reflection.getSignature, "getter"));
  }
  
  if (reflection.setSignature) {
    signatures.push(buildGetSetSignature(reflection.setSignature, "setter"));
  }
  
  // Handle index signatures
  if (reflection.indexSignatures) {
    for (const indexSig of reflection.indexSignatures) {
      signatures.push({
        name: "__index",
        kind: indexSig.kind,
        signature: buildIndexSignatureString(indexSig, project),
        parameters: extractParameters(indexSig),
        returnType: {
          type: typeToString(indexSig.type, project),
          typeRaw: indexSig.type,
        },
        documentation: {
          summary: indexSig.comment?.summary
            ? extractCommentParts(indexSig.comment.summary)
            : undefined,
        },
      } as SignatureDetail);
    }
  }
  
  return signatures;
}

function extractParameters(reflection: any): ParameterDetail[] {
  if (!reflection.parameters) return [];
  
  return reflection.parameters.map((param: any) => ({
    name: param.name,
    kind: param.kind,
    type: {
      type: param.type ? typeToString(param.type, reflection) : "any",
      typeRaw: param.type,
    },
    description: param.comment?.summary
      ? extractCommentParts(param.comment.summary)
      : undefined,
    isOptional: param.flags?.isOptional || false,
    isRest: param.flags?.isRest || false,
    defaultValue: param.defaultValue,
  }));
}

function extractAllTags(reflection: any): TagsDetail {
  const comment = reflection.comment || {};
  const tags: TagsDetail = {
    examples: [],
    examples_md: [],
    tutorials: [],
    seeTags: [],
    throwsTags: [],
    returnsTags: [],
    paramTags: [],
    typeparamTags: [],
    customTags: {},
  };
  
  if (!comment.blockTags) return tags;
  
  for (const tag of comment.blockTags) {
    switch (tag.tag) {
      case "@example": {
        const text = extractCommentParts(tag.content);
        tags.examples?.push({
          text,
          isCode: isCodeExample(text),
          language: detectLanguage(text),
        });
        
        // Extract markdown code blocks
        const codeBlocks = extractCodeBlocks(text);
        tags.examples_md?.push(...codeBlocks);
        break;
      }
      
      case "@tutorial":
      case "@tutorials": {
        tags.tutorials?.push(extractCommentParts(tag.content));
        break;
      }
      
      case "@see": {
        tags.seeTags?.push(extractCommentParts(tag.content));
        break;
      }
      
      case "@throws":
      case "@throw": {
        tags.throwsTags?.push(extractCommentParts(tag.content));
        break;
      }
      
      case "@returns":
      case "@return": {
        tags.returnsTags?.push({
          type: tag.typeExpression
            ? typeToString(tag.typeExpression, reflection)
            : undefined,
          typeRaw: tag.typeExpression,
          description: extractCommentParts(tag.content),
        });
        break;
      }
      
      case "@param": {
        tags.paramTags?.push({
          paramName: tag.name,
          type: tag.typeExpression
            ? typeToString(tag.typeExpression, reflection)
            : undefined,
          typeRaw: tag.typeExpression,
          description: extractCommentParts(tag.content),
        });
        break;
      }
      
      case "@typeParam":
      case "@template": {
        tags.typeparamTags?.push({
          paramName: tag.name,
          description: extractCommentParts(tag.content),
        });
        break;
      }
      
      default: {
        // Custom tags
        if (!tags.customTags) {
          tags.customTags = {};
        }
        if (!tags.customTags[tag.tag]) {
          tags.customTags[tag.tag] = [];
        }
        tags.customTags[tag.tag].push(extractCommentParts(tag.content));
      }
    }
  }
  
  return tags;
}

function extractModifiers(reflection: any): ModifiersDetail {
  const flags = reflection.flags || {};
  return {
    isAbstract: flags.isAbstract,
    isAsync: flags.isAsync,
    isConst: flags.isConst,
    isReadonly: flags.isReadonly,
    isOptional: flags.isOptional,
    isStatic: flags.isStatic,
    isPrivate: flags.isPrivate,
    isProtected: flags.isProtected,
    isPublic: flags.isPublic,
    isExternal: flags.isExternal,
  };
}

function extractSourceInfo(reflection: any): SourceInfo {
  const source = reflection.sources?.[0];
  return {
    filename: source?.fileName || "unknown",
    lineStart: source?.line,
    lineEnd: source?.character,
    url: source?.url,
  };
}

function extractHierarchy(reflection: any, project: any): HierarchyDetail {
  return {
    parentId: reflection.parent?.toString(),
    parentName: reflection.parent
      ? getReflectionName(reflection.parent, project)
      : undefined,
    parentKind: reflection.parent
      ? getReflectionKind(reflection.parent, project)
      : undefined,
    childrenIds: reflection.children?.map((c: any) => c.id?.toString()),
    moduleId: reflection.module?.id?.toString(),
    moduleName: reflection.module?.name,
  };
}

function generateSearchTokens(reflection: any, fullPath: string): string[] {
  const tokens = [
    reflection.name,
    fullPath,
    reflection.kind,
  ];
  
  const doc = extractDocumentation(reflection);
  const summaryTokens = doc.summary.split(/\s+/).slice(0, 10);
  tokens.push(...summaryTokens);
  
  if (reflection.comment?.blockTags) {
    reflection.comment.blockTags.forEach((tag: any) => {
      if (tag.tag === "@example" || tag.tag === "@tutorial") {
        const text = extractCommentParts(tag.content);
        const textTokens = text.split(/\s+/).slice(0, 5);
        tokens.push(...textTokens);
      }
    });
  }
  
  return tokens.filter((t) => t && t.length > 0);
}

function resolveTypeName(typeRef: any, project: any): string {
  return typeRef.name || "unknown";
}

function getReflectionName(id: any, project: any): string {
  // Implement based on your project structure
  return "unknown";
}

function getReflectionKind(id: any, project: any): string {
  // Implement based on your project structure
  return "unknown";
}
