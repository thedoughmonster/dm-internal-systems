const CLASS_COMPOSERS = new Set(["cn", "clsx", "twMerge", "classNames"]);

function isStringLike(node) {
  return (
    (node.type === "Literal" && typeof node.value === "string") ||
    node.type === "TemplateLiteral"
  );
}

function hasRawString(node) {
  if (!node) {
    return false;
  }

  if (isStringLike(node)) {
    return true;
  }

  switch (node.type) {
    case "JSXExpressionContainer":
      return hasRawString(node.expression);
    case "ConditionalExpression":
      return (
        hasRawString(node.consequent) ||
        hasRawString(node.alternate) ||
        hasRawString(node.test)
      );
    case "LogicalExpression":
    case "BinaryExpression":
      return hasRawString(node.left) || hasRawString(node.right);
    case "SequenceExpression":
      return node.expressions.some(hasRawString);
    case "ArrayExpression":
      return node.elements.some((element) => element && hasRawString(element));
    case "ObjectExpression":
      return node.properties.some((prop) => {
        if (prop.type !== "Property") {
          return false;
        }
        return hasRawString(prop.value);
      });
    case "UnaryExpression":
    case "UpdateExpression":
      return hasRawString(node.argument);
    case "CallExpression":
      return node.arguments.some((arg) => hasRawString(arg));
    default:
      return false;
  }
}

function isClassComposerCall(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  if (node.callee.type === "Identifier") {
    return CLASS_COMPOSERS.has(node.callee.name);
  }

  if (
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier"
  ) {
    return CLASS_COMPOSERS.has(node.callee.property.name);
  }

  return false;
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw className string/template literals and raw utility strings in class composition helpers inside directives TSX files.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== "className" || !node.value) {
          return;
        }

        if (hasRawString(node.value)) {
          context.report({
            node,
            message:
              "Use style-token references (e.g. styles.*) for className; raw string or template class literals are not allowed in directives JSX.",
          });
        }
      },
      CallExpression(node) {
        if (!isClassComposerCall(node)) {
          return;
        }

        for (const arg of node.arguments) {
          if (hasRawString(arg)) {
            context.report({
              node: arg,
              message:
                "Raw class/utility string literals are not allowed in class composition helpers in directives JSX.",
            });
            return;
          }
        }
      },
    };
  },
};

export default rule;
