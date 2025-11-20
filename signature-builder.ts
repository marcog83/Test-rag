/**
 * Builds complete function/method signature strings
 * Handles type parameters, parameters, and return types
 */

import { typeToString } from "./type-converter.js";
import type { SignatureDetail, ParameterDetail } from "./types.js";

export function buildSignatureString(
  declaration: any,
  signature: any,
  context?: any
): string {
  const typeParamStr = buildTypeParameterString(
    signature.typeParameters,
    context
  );
  const paramStr = buildParameterString(signature.parameters, context);
  const returnType = typeToString(signature.type, context);
  
  return `${declaration.name}${typeParamStr}(${paramStr}): ${returnType}`;
}

export function buildTypeParameterString(
  typeParams?: any[],
  context?: any
): string {
  if (!typeParams || typeParams.length === 0) {
    return "";
  }
  
  const params = typeParams
    .map((tp) => {
      let param = tp.name;
      
      if (tp.type) {
        param += ` extends ${typeToString(tp.type, context)}`;
      }
      
      if (tp.default) {
        param += ` = ${typeToString(tp.default, context)}`;
      }
      
      return param;
    })
    .join(", ");
  
  return `<${params}>`;
}

export function buildParameterString(
  parameters?: any[],
  context?: any
): string {
  if (!parameters || parameters.length === 0) {
    return "";
  }
  
  return parameters
    .map((param) => {
      let paramStr = "";
      
      if (param.flags?.isRest) {
        paramStr += "...";
      }
      
      paramStr += param.name;
      
      if (param.flags?.isOptional) {
        paramStr += "?";
      }
      
      paramStr += `: ${typeToString(param.type, context)}`;
      
      if (param.defaultValue) {
        paramStr += ` = ${param.defaultValue}`;
      }
      
      return paramStr;
    })
    .join(", ");
}

export function buildGetSetSignature(sig: any, type: "getter" | "setter"): SignatureDetail {
  const returnType = typeToString(sig.type, sig);
  
  const signature =
    type === "getter"
      ? `get property(): ${returnType}`
      : `set property(value: ${returnType}): void`;
  
  return {
    name: type,
    kind: type === "getter" ? "GetSignature" : "SetSignature",
    signature,
    parameters: type === "setter" ? buildParameters(sig) : [],
    returnType: {
      type: type === "getter" ? returnType : "void",
      typeRaw: sig.type,
    },
    documentation: {
      summary: sig.comment?.summary ? extractCommentParts(sig.comment.summary) : undefined,
    },
  };
}

export function buildIndexSignatureString(indexSig: any, context?: any): string {
  const params = indexSig.parameters
    .map(
      (p: any) =>
        `${p.name}: ${typeToString(p.type, context)}`
    )
    .join(", ");
  
  const returnType = typeToString(indexSig.type, context);
  
  return `[${params}]: ${returnType}`;
}

function buildParameters(reflection: any): ParameterDetail[] {
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

function extractCommentParts(parts?: any[]): string {
  if (!parts) return "";
  
  return parts
    .map((part) => {
      if (part.kind === "text") return part.text;
      if (part.kind === "code") return `\`${part.text}\``;
      return "";
    })
    .join("");
}
