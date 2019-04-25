import { Document, Element, Node } from './node';
import { format } from 'util';

// format indent
let isFirstFormat = true;
let indentLen = 0;
let indentStr: string | boolean = '  '; // element indent
let attributeNewline: boolean | number = false; // attribute in new line

function formatStr(indent: number = 0) {
  // remove first newline '\n'
  if (isFirstFormat) {
    isFirstFormat = false;
    return '';
  }

  if (typeof indentStr === 'string') {
    return `\n${indentStr.repeat(indent || indentLen)}`;
  } else {
    return '';
  }
}

// element stringify
function elementStringify(element: Element) {
  let result: string = '';

  // document
  if (element.nodeType === 'document') {
    if (element.children && element.children!.length) {
      element.children!.forEach(elem => {
        result += elementStringify(elem as Element);
      });
    }
    return result;
  }

  // element
  if (element.nodeType === 'element') {
    // start element
    result += formatStr() + '<' + (element as Element).tagName;

    // Get attribute string
    if (element.attributes) {
      let attrStr = '';
      let inNewLine = false;
      if (attributeNewline && element.attributes.length >= attributeNewline) {
        inNewLine = true;
      }
      element.attributes.forEach(({ key, value, isBoolean }) => {
        attrStr += (inNewLine ? formatStr(indentLen + 1) : ' ') + key;
        if (!isBoolean) {
          attrStr += `="${value}"`;
        }
      });

      if (inNewLine) {
        attrStr += formatStr(indentLen);
      }
      result += attrStr;
    }

    // selfClosing
    if (
      element.selfClosing &&
      !(element.children && element.children.length !== 0)
    ) {
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
    if (
      !element.lastChild ||
      (element.lastChild && element.lastChild.nodeType === 'text')
    ) {
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

  return result;
}

function generate(
  ast: Document,
  options: {
    format: string | boolean;
    attributeNewline?: boolean | number;
    // closingBracketNewline?: boolean;
  } = {
    format: false,
    attributeNewline: false
  }
): string {
  if (options.format) {
    if (typeof options.format === 'string') {
      indentStr = options.format;
    }
  } else {
    indentStr = false;
  }

  if (typeof options.attributeNewline === 'boolean') {
    attributeNewline = options.attributeNewline ? 1 : 0;
  } else {
    attributeNewline = options.attributeNewline || 0;
  }

  const result = elementStringify(ast as Element);

  // reset
  isFirstFormat = true;
  indentLen = 0;
  indentStr = '  '; // 缩进

  return result;
}

export default {
  generate
};
