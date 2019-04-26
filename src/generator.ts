import { GenerateOptions } from '../types/tokenizer';
import { Element, Node } from './node';

// format indent
const defaultIndentStr: string = '  ';
let isFirstFormat = true;
let indentLen = 0;
let indentStr: string | boolean = defaultIndentStr; // element indent
let isAttributeNewline: boolean | number = false; // attribute in new line

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
function elementStringify(element: Node) {
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
      if (
        isAttributeNewline &&
        element.attributes.length >= isAttributeNewline
      ) {
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
      result += `</${(element as Element).tagName}>`;
    } else {
      result += formatStr() + `</${(element as Element).tagName}>`;
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
  ast: Node,
  { format = false, attributeNewline = false }: GenerateOptions = {}
): string {
  if (format) {
    if (typeof format === 'string') {
      indentStr = format;
    }
  } else {
    indentStr = false;
  }

  if (typeof attributeNewline === 'boolean') {
    isAttributeNewline = attributeNewline ? 1 : 0;
  } else {
    isAttributeNewline = attributeNewline || 0;
  }

  // force format be true when attributeNewline is true
  if (isAttributeNewline && format === false) {
    indentStr = defaultIndentStr;
  }

  const result = elementStringify(ast);

  // reset
  isFirstFormat = true;
  indentLen = 0;
  indentStr = defaultIndentStr; // indent

  return result;
}

export default {
  generate
};
