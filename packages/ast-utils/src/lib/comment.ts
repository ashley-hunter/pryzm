import * as ts from 'typescript';

export function extractComment(node: ts.Node): string | undefined {
  // extract the comment if it exists
  let comment = node.getFullText().substring(0, node.getLeadingTriviaWidth()).trim();

  // if the comment is a JSDoc comment, remove the leading and trailing asterisks
  if (comment.startsWith('/**')) {
    comment = comment.replace(/^\/\*\*|\*\/$/g, '').trim();
  }

  // if the comment is a single line comment, remove the leading double slash
  if (comment.startsWith('//')) {
    comment = comment.replace(/^\/\//, '').trim();
  }

  // return the comment if it exists
  return comment.length > 0 ? comment : undefined;
}

export function addComment(node: ts.Node, comment?: string) {
  if (!comment) {
    return;
  }

  ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, ` ${comment} `, true);
}

export function insertComment(statement: string, comment?: string) {
  return comment ? `/** ${comment} */\n${statement}` : statement;
}
