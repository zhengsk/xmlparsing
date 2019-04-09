import fs from 'fs';
import { Tokenizer } from './tokenizer';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

type elementType = 'root' | 'element' | 'text' | 'comment' | 'cdata';

class Element {
  type: elementType;
  stats?: EventValue;
  attributes?: Map<string, string>;
  children: Element[] | undefined;
  tagName: string;

  constructor(type: elementType, stats: EventValue) {
    this.type = type;
    this.tagName = stats!.value!;
    this.stats = stats;
  }

  appendChild(element: Element): Element {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(element);
    return element;
  }

  setAttribute(key: string , value: string) {
    if (!this.attributes){
      this.attributes = new Map();
    }
    this.attributes.set(key, value);
  }

  getAttribute(key: string): string|null {
    if (this.attributes){
      return this.attributes.get(key)!;
    }
    return null;
  }
}

class AST extends Element{
  type: elementType = 'root';
  children: Element[] = [];
}


const ast = new AST('root', {
  value: 'docuement',
  index: 0,
  startIndex: 0,
  column: 1,
  row: 1,
});

const elementStack: Element[] = [];
let currentElement: Element = ast;


function createElement(type: EventNames, stats: EventValue) {
  if (type === 'elementOpen') {
    return new Element('element', stats);
  }
}


const tokenizer = new Tokenizer(xmlStr, {
  text(stats) {
    currentElement.appendChild(new Element('text', stats));
  },

  comment(stats) {
    currentElement.appendChild(new Element('comment', stats));
  },

  cdata(stats) {
    currentElement.appendChild(new Element('cdata', stats));
  },

  elementOpen(stats) {
    elementStack.push(currentElement);
    currentElement = currentElement.appendChild(new Element('element', stats));
  },

  attributeName(stats) {
    // currentElement.setAttribute(stats.value!, stats.);
  },

  attributeValue(stats) {
    // console.table(stats);
  },

  attribute(stats) {
    currentElement.setAttribute(stats.key!, stats.value!);
  },

  elementClose(stats) {
    currentElement = elementStack.pop()!;
    console.info(ast);
    // debugger; // eslint-disable-line
  },

  end(){
    debugger; // eslint-disable-line
    console.info(ast);
  },

  error(stats) {
    debugger; // eslint-disable-line
  },
});

tokenizer.parse();
