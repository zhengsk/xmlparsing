import { AST, Element, Node } from './parser';

// format indent
let indentLen = 0;

const indentStr = '  '; // 缩进
function formatStr() {
  return `\n${indentStr.repeat(indentLen)}`;
}

// element stringify
function elementStringify(element: Element) {
  let result: string = '';

  // element
  if (element.nodeType === 'element') {
    // start element
    result += formatStr() + '<' + (element as Element).tagName;

    // Get attribute string
    if (element.attributs && element.attributs.attributs.size) {
      let attrStr = '';
      element.attributs.attributs.forEach((value, key) => {
        attrStr += ' ' + key;
        if (value !== null) {
          attrStr += `="${value}"`;
        }
      });
      result += attrStr;
    }

    // selfClosing
    if (element.selfClosing) {
      result += '/>';
      return result;
    } else {
      result += '>';
    }

    // children
    if (element.children && element.children.length) {
      indentLen++;
      element.children!.forEach(elem => {
        result += elementStringify(elem as Element);
      });
      indentLen--;
    }

    // close element
    if (element.lastChild && element.lastChild.nodeType === 'text') {
      result += `</${element.tagName}>`;
    } else {
      result += formatStr() + `</${element.tagName}>`;
    }

    return result;
  }

  // text
  if (element.nodeType === 'text') {
    result += `${element.nodeValue}`;
    return result;
  }

  // comment
  if (element.nodeType === 'comment') {
    result += formatStr() + `<!--${element.nodeValue}-->`;
    return result;
  }

  // cdata
  if (element.nodeType === 'cdata') {
    result += formatStr() + `<![CDATA[${element.nodeValue}]]>`;
    return result;
  }
}

function generate(ast: AST): string {
  let result: string = '';
  if (ast.nodeType === 'document') {
    const element = ast;
    if (element.children!.length) {
      element.children!.forEach(elem => {
        result += elementStringify(elem as Element);
      });
    }
  }

  return result;
}

export default {
  generate
};
