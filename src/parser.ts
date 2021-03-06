import { Tokenizer } from './tokenizer';
import { Document, Node, Text, Comment, Cdata, Element } from './node';

// parse
function parse(
  xmlStr: string,
  options: {
    plainTextNodes?: string[];
    ignoreWhitespace?: boolean;
    attributeValueWithoutQuotes?: boolean;
    checkElementName?: () => void;
    checkAttributeName?: () => void;
  } = {}
): Document {
  // ast
  const ast = new Document({});

  const elementStack: Node[] = [];
  let currentElement: Node = ast;

  const tokenizer = new Tokenizer(
    {
      text(stats) {
        currentElement.appendChild(new Text(stats));
      },

      comment(stats) {
        currentElement.appendChild(new Comment(stats));
      },

      cdata(stats) {
        currentElement.appendChild(new Cdata(stats));
      },

      elementOpen(stats) {
        elementStack.push(currentElement);
        currentElement = currentElement.appendChild(new Element(stats));
      },

      attribute(stats) {
        currentElement.setAttribute(stats.name!, stats.value!);
      },

      elementClose(stats) {
        if (stats.selfClosing) {
          currentElement.selfClosing = true;
        }
        currentElement = elementStack.pop()!;
      },

      end() {
        // console.info(ast);
      },

      error(stats, err) {
        throw {
          error: err,
          stats
        };
      }
    },
    options
  );

  tokenizer.parse(xmlStr);

  return ast;
}

export default {
  parse
};
