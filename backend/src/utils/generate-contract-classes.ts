import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

type ScalarKind = 'string' | 'number' | 'boolean';
type AnalysisKind = 'scalar' | 'enum' | 'nested' | 'unsupported';

interface TypeAnalysis {
  kind: AnalysisKind;
  scalarKind?: ScalarKind;
  enumName?: string;
  nestedName?: string;
  isArray: boolean;
  nullable: boolean;
  optionalFromUndefined: boolean;
}

const GENERATED_HEADER = `/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED FROM CONTRACT INTERFACES          ##
 * ---------------------------------------------------------------
 */
`;

const isNullTypeNode = (typeNode: ts.TypeNode): boolean => {
  return typeNode.kind === ts.SyntaxKind.NullKeyword || (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.NullKeyword);
};

const isUndefinedTypeNode = (typeNode: ts.TypeNode): boolean => {
  return typeNode.kind === ts.SyntaxKind.UndefinedKeyword || (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'undefined');
};

const unwrapParenthesizedType = (typeNode: ts.TypeNode): ts.TypeNode => {
  if (ts.isParenthesizedTypeNode(typeNode)) {
    return unwrapParenthesizedType(typeNode.type);
  }
  return typeNode;
};

const normalizeTypeNode = (typeNode: ts.TypeNode) => {
  let nullable = false;
  let optionalFromUndefined = false;
  let normalizedTypeNode = unwrapParenthesizedType(typeNode);

  if (ts.isUnionTypeNode(normalizedTypeNode)) {
    const filtered = normalizedTypeNode.types.filter(type => {
      const unwrapped = unwrapParenthesizedType(type);
      if (isNullTypeNode(unwrapped)) {
        nullable = true;
        return false;
      }
      if (isUndefinedTypeNode(unwrapped)) {
        optionalFromUndefined = true;
        return false;
      }
      return true;
    });

    if (filtered.length === 1) {
      normalizedTypeNode = unwrapParenthesizedType(filtered[0]);
    } else if (filtered.length > 1) {
      normalizedTypeNode = ts.factory.createUnionTypeNode(filtered);
    } else {
      normalizedTypeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
    }
  }

  return {
    normalizedTypeNode,
    nullable,
    optionalFromUndefined,
  };
};

const analyzeTypeNode = (
  typeNode: ts.TypeNode,
  interfaceNames: Set<string>,
  enumNames: Set<string>,
): TypeAnalysis => {
  const { normalizedTypeNode, nullable, optionalFromUndefined } = normalizeTypeNode(typeNode);

  const analyzeScalarLikeNode = (node: ts.TypeNode): Omit<TypeAnalysis, 'nullable' | 'optionalFromUndefined' | 'isArray'> => {
    if (node.kind === ts.SyntaxKind.StringKeyword) {
      return { kind: 'scalar', scalarKind: 'string' };
    }
    if (node.kind === ts.SyntaxKind.NumberKeyword) {
      return { kind: 'scalar', scalarKind: 'number' };
    }
    if (node.kind === ts.SyntaxKind.BooleanKeyword) {
      return { kind: 'scalar', scalarKind: 'boolean' };
    }

    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.getText();

      if (enumNames.has(typeName)) {
        return { kind: 'enum', enumName: typeName };
      }

      if (interfaceNames.has(typeName)) {
        return { kind: 'nested', nestedName: typeName };
      }
    }

    return { kind: 'unsupported' };
  };

  if (ts.isArrayTypeNode(normalizedTypeNode)) {
    const elementNode = unwrapParenthesizedType(normalizedTypeNode.elementType);
    const result = analyzeScalarLikeNode(elementNode);
    return {
      ...result,
      isArray: true,
      nullable,
      optionalFromUndefined,
    };
  }

  if (
    ts.isTypeReferenceNode(normalizedTypeNode) &&
    normalizedTypeNode.typeName.getText() === 'Array' &&
    normalizedTypeNode.typeArguments?.length === 1
  ) {
    const elementNode = unwrapParenthesizedType(normalizedTypeNode.typeArguments[0]);
    const result = analyzeScalarLikeNode(elementNode);
    return {
      ...result,
      isArray: true,
      nullable,
      optionalFromUndefined,
    };
  }

  const result = analyzeScalarLikeNode(normalizedTypeNode);
  return {
    ...result,
    isArray: false,
    nullable,
    optionalFromUndefined,
  };
};

const escapeSingleQuotes = (value: string) => value.replace(/'/g, "\\'");

const getPropertyKey = (name: ts.PropertyName): string | null => {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return `'${escapeSingleQuotes(name.text)}'`;
  }
  return null;
};

const buildDecorators = (
  analysis: TypeAnalysis,
  isOptional: boolean,
  classValidatorImports: Set<string>,
  classTransformerImports: Set<string>,
  customImports: Set<string>,
  enumImports: Set<string>,
) => {
  const decorators: string[] = [];

  if (analysis.nullable) {
    customImports.add('IsNullable');
    decorators.push('@IsNullable()');
  }

  if (analysis.nullable && !isOptional) {
    classValidatorImports.add('ValidateIf');
    decorators.push('@ValidateIf((_obj, value) => value !== null)');
  }

  if (isOptional) {
    classValidatorImports.add('IsOptional');
    decorators.push('@IsOptional()');
  } else {
    classValidatorImports.add('IsDefined');
    decorators.push('@IsDefined()');
  }

  const addScalarDecorator = (kind: ScalarKind, each = false) => {
    if (kind === 'string') {
      classValidatorImports.add('IsString');
      decorators.push(each ? '@IsString({ each: true })' : '@IsString()');
      return;
    }

    if (kind === 'number') {
      classValidatorImports.add('IsInt');
      decorators.push(each ? '@IsInt({ each: true })' : '@IsInt()');
      return;
    }

    classValidatorImports.add('IsBoolean');
    decorators.push(each ? '@IsBoolean({ each: true })' : '@IsBoolean()');
  };

  if (analysis.kind === 'scalar' && analysis.scalarKind) {
    addScalarDecorator(analysis.scalarKind, analysis.isArray);
    return decorators;
  }

  if (analysis.kind === 'enum' && analysis.enumName) {
    enumImports.add(analysis.enumName);
    classValidatorImports.add('IsEnum');
    decorators.push(analysis.isArray ? `@IsEnum(${analysis.enumName}, { each: true })` : `@IsEnum(${analysis.enumName})`);
    return decorators;
  }

  if (analysis.kind === 'nested' && analysis.nestedName) {
    classValidatorImports.add('ValidateNested');
    classTransformerImports.add('Type');
    decorators.push(analysis.isArray ? '@ValidateNested({ each: true })' : '@ValidateNested()');
    decorators.push(`@Type(() => ${analysis.nestedName})`);
    return decorators;
  }

  classValidatorImports.add('Allow');
  decorators.push('@Allow()');
  return decorators;
};

const renderPropertyLine = (
  member: ts.PropertySignature,
  sourceFile: ts.SourceFile,
  interfaceNames: Set<string>,
  enumNames: Set<string>,
  classValidatorImports: Set<string>,
  classTransformerImports: Set<string>,
  customImports: Set<string>,
  enumImports: Set<string>,
) => {
  if (!member.type || !member.name) {
    return null;
  }

  const propertyKey = getPropertyKey(member.name);
  if (!propertyKey) {
    return null;
  }

  const analysis = analyzeTypeNode(member.type, interfaceNames, enumNames);
  const isOptional = Boolean(member.questionToken) || analysis.optionalFromUndefined;
  const decorators = buildDecorators(analysis, isOptional, classValidatorImports, classTransformerImports, customImports, enumImports);
  const typeText = member.type.getText(sourceFile);
  const propertyLine = `${propertyKey}${isOptional ? '?' : '!'}: ${typeText};`;

  return [...decorators, propertyLine];
};

export const renderContractClassesSource = (sourceText: string, importPath = './data-contracts'): string | null => {
  const sourceFile = ts.createSourceFile('data-contracts.ts', sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const interfaceDeclarations = sourceFile.statements.filter(ts.isInterfaceDeclaration);
  if (!interfaceDeclarations.length) {
    return null;
  }

  const enumNames = new Set<string>(sourceFile.statements.filter(ts.isEnumDeclaration).map(enumDeclaration => enumDeclaration.name.text));
  const interfaceNames = new Set<string>(interfaceDeclarations.map(interfaceDeclaration => interfaceDeclaration.name.text));

  const classValidatorImports = new Set<string>();
  const classTransformerImports = new Set<string>();
  const customImports = new Set<string>();
  const enumImports = new Set<string>();

  const classBlocks: string[] = [];

  for (const interfaceDeclaration of interfaceDeclarations) {
    const classLines: string[] = [`export class ${interfaceDeclaration.name.text} {`];

    for (const member of interfaceDeclaration.members) {
      if (!ts.isPropertySignature(member)) {
        continue;
      }

      const propertyLines = renderPropertyLine(
        member,
        sourceFile,
        interfaceNames,
        enumNames,
        classValidatorImports,
        classTransformerImports,
        customImports,
        enumImports,
      );

      if (!propertyLines) {
        continue;
      }

      classLines.push(...propertyLines.map(line => `  ${line}`));
    }

    classLines.push('}');
    classBlocks.push(classLines.join('\n'));
  }

  const imports: string[] = [];
  if (enumImports.size > 0) {
    imports.push(`import { ${Array.from(enumImports).sort().join(', ')} } from '${importPath}';`);
  }
  if (classTransformerImports.size > 0) {
    imports.push(`import { ${Array.from(classTransformerImports).sort().join(', ')} } from 'class-transformer';`);
  }
  if (classValidatorImports.size > 0) {
    imports.push(`import { ${Array.from(classValidatorImports).sort().join(', ')} } from 'class-validator';`);
  }
  if (customImports.size > 0) {
    imports.push(`import { ${Array.from(customImports).sort().join(', ')} } from '@/utils/custom-validation-classes';`);
  }

  return `${GENERATED_HEADER}\n${imports.join('\n')}\n\n${classBlocks.join('\n\n')}\n`;
};

export const generateContractClassesForFile = (filePath: string): string | null => {
  const sourceText = fs.readFileSync(filePath, 'utf-8');
  const fileNameWithoutExt = path.basename(filePath, '.ts');
  const rendered = renderContractClassesSource(sourceText, `./${fileNameWithoutExt}`);

  if (!rendered) {
    return null;
  }

  const outputPath = filePath.replace(/\.ts$/, '.classes.ts');
  fs.writeFileSync(outputPath, rendered, 'utf-8');
  return outputPath;
};

const collectContractFiles = (directoryPath: string): string[] => {
  const results: string[] = [];
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectContractFiles(entryPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.endsWith('.classes.ts') || !entry.name.endsWith('.ts')) {
      continue;
    }

    results.push(entryPath);
  }

  return results;
};

export const generateContractClassesForDirectory = (directoryPath: string): string[] => {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  const contractFiles = collectContractFiles(directoryPath);
  const generatedFiles: string[] = [];

  for (const contractFilePath of contractFiles) {
    const generated = generateContractClassesForFile(contractFilePath);
    if (generated) {
      generatedFiles.push(generated);
    }
  }

  return generatedFiles;
};
