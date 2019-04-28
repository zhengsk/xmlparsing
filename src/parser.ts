import { Tokenizer } from './tokenizer';
import { Document, Node, Text, Comment, Cdata, Element } from './node';

// parse
function parse(xmlStr: string): Document {
  // ast
  const ast = new Document({
    value: 'docuement',
    index: 0,
    startIndex: 0,
    column: 1,
    row: 1
  });

  const elementStack: Node[] = [];
  let currentElement: Node = ast;

  const tokenizer = new Tokenizer(
    {
      text(stats) {
        // skip whitespace text node.
        if (/^[\s]+$/.test(stats.value!)) {
          return false;
        }
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
        // console.info(ast);
      },

      end() {
        // console.info(ast);
      },

      error(stats, err) {
        debugger; // tslint:disable-line
      }
    },
    {
      plainTextNodes: ['script', 'style']
    }
  );

  tokenizer.parse(xmlStr);

  return ast;
}

export default {
  parse
};
