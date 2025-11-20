/**
 * Converts TypeDoc type objects to readable string representations
 * Handles all TypeScript type constructs
 */

export function typeToString(type: any, context?: any): string {
  if (!type) return "any";
  
  if (typeof type === "string") {
    return type;
  }
  
  switch (type.type) {
    case "intrinsic":
      return type.name || "any";
    
    case "reference":
      return handleReferenceType(type);
    
    case "array":
      return `${typeToString(type.elementType, context)}[]`;
    
    case "union":
      return type.types
        .map((t: any) => typeToString(t, context))
        .join(" | ");
    
    case "intersection":
      return type.types
        .map((t: any) => typeToString(t, context))
        .join(" & ");
    
    case "literal":
      return stringifyLiteral(type.value);
    
    case "tuple":
      return `[${type.elements
        .map((t: any) => typeToString(t, context))
        .join(", ")}]`;
    
    case "namedTupleMember":
      const name = type.name || "unknown";
      const element = typeToString(type.element, context);
      return `${name}: ${element}`;
    
    case "reflection":
      return handleReflectionType(type, context);
    
    case "optional":
      return `${typeToString(type.elementType, context)} | undefined`;
    
    case "rest":
      return `...${typeToString(type.elementType, context)}`;
    
    case "conditional":
      return handleConditionalType(type, context);
    
    case "inferred":
      return handleInferredType(type, context);
    
    case "indexedAccess":
      return `${typeToString(type.objectType, context)}[${typeToString(
        type.indexType,
        context
      )}]`;
    
    case "mapped":
      return handleMappedType(type, context);
    
    case "typeOperator":
      return `${type.operator} ${typeToString(type.target, context)}`;
    
    case "query":
      return `typeof ${typeToString(type.queryType, context)}`;
    
    case "templateLiteral":
      return handleTemplateLiteral(type, context);
    
    case "predicate":
      return handlePredicate(type, context);
    
    default:
      return type.name || "unknown";
  }
}

function handleReferenceType(type: any): string {
  let result = type.name || "unknown";
  
  if (type.typeArguments && type.typeArguments.length > 0) {
    result += `<${type.typeArguments.map((t: any) => typeToString(t)).join(", ")}>`;
  }
  
  return result;
}

function stringifyLiteral(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "object") {
    // BigInt support
    if (value.negative !== undefined && value.value !== undefined) {
      return `${value.negative ? "-" : ""}${value.value}n`;
    }
  }
  return JSON.stringify(value);
}

function handleReflectionType(type: any, context?: any): string {
  if (!type.declaration) return "{...}";
  
  // Try to build object signature
  const declaration = type.declaration;
  
  if (declaration.children) {
    const props = declaration.children
      .map((child: any) => {
        const propType = child.type ? typeToString(child.type, context) : "any";
        return `${child.name}: ${propType}`;
      })
      .join("; ");
    
    return `{ ${props} }`;
  }
  
  if (declaration.signatures) {
    // Function type
    const sig = declaration.signatures[0];
    const params = sig.parameters
      ?.map((p: any) => `${p.name}: ${typeToString(p.type, context)}`)
      .join(", ") || "";
    const returnType = typeToString(sig.type, context);
    return `(${params}) => ${returnType}`;
  }
  
  return "{...}";
}

function handleConditionalType(type: any, context?: any): string {
  const check = typeToString(type.checkType, context);
  const extendsType = typeToString(type.extendsType, context);
  const trueType = typeToString(type.trueType, context);
  const falseType = typeToString(type.falseType, context);
  
  return `${check} extends ${extendsType} ? ${trueType} : ${falseType}`;
}

function handleInferredType(type: any, context?: any): string {
  let result = `infer ${type.name}`;
  
  if (type.constraint) {
    result += ` extends ${typeToString(type.constraint, context)}`;
  }
  
  return result;
}

function handleMappedType(type: any, context?: any): string {
  let result = "{ ";
  
  if (type.readonlyModifier) {
    result += `${type.readonlyModifier} `;
  }
  
  result += `[${type.parameter} in ${typeToString(type.parameterType, context)}]`;
  
  if (type.optionalModifier) {
    result += `${type.optionalModifier}`;
  }
  
  result += `: ${typeToString(type.templateType, context)}`;
  
  if (type.nameType) {
    result += ` as ${typeToString(type.nameType, context)}`;
  }
  
  result += " }";
  
  return result;
}

function handleTemplateLiteral(type: any, context?: any): string {
  let result = "`" + type.head;
  
  for (const [tailType, tailStr] of type.tail) {
    result += "${" + typeToString(tailType, context) + "}" + tailStr;
  }
  
  result += "`";
  return result;
}

function handlePredicate(type: any, context?: any): string {
  let result = type.name;
  
  if (type.asserts) {
    result = `asserts ${result}`;
  }
  
  if (type.targetType) {
    result += ` is ${typeToString(type.targetType, context)}`;
  }
  
  return result;
}
