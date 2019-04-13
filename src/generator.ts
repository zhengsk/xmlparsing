import { Document, Element, Node } from './parser';
import { format } from 'util';

// format indent
let isFirstFormat = true;
let indentLen = 0;
let indentStr: string | boolean = '  '; // 缩进

function formatStr() {
  // remove first newline '\n'
  if (isFirstFormat) {
    isFirstFormat = false;
    return '';
  }

  if (typeof indentStr === 'string') {
    return `\n${indentStr.repeat(indentLen)}`;
  } else {
    return '';
  }
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

function generate(
  ast: Document,
  options: { format: string | boolean } = { format: false }
): string {
  if (options.format) {
    if (typeof options.format === 'string') {
      indentStr = options.format;
    }
  } else {
    indentStr = false;
  }
  let result: string = '';
  if (ast.nodeType === 'document') {
    const element = ast;
    if (element.children && element.children!.length) {
      element.children!.forEach(elem => {
        result += elementStringify(elem as Element);
      });
    }
  }

  // reset
  isFirstFormat = true;
  indentLen = 0;
  indentStr = '  '; // 缩进

  return result;
}

export default {
  generate
};
