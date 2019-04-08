import fs from 'fs';
import { Tokenizer } from './tokenizer';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

type elementType = 'root' | 'element' | 'text' | 'comment' | 'cdata';

class Element {
  type: elementType;
  stats?: EventValue;
  children: Element[] | undefined;

  constructor(type: elementType, stats?: EventValue) {
    this.type = type;
    this.stats = stats;
  }
}

class AST extends Element{
  type: elementType = 'root';
  children: Element[] = [];
  currentElement: Element = this;

  addChild(element: Element) {
    if (!this.currentElement.children) {
      this.currentElement.children = [];
    }
    this.currentElement.children.push(element);
  }
  
}


const ast = new AST('root');




function createElement(type: EventNames, stats: EventValue) {
  if (type === 'elementOpen') {
    return new Element('element', stats);
  }
}

const currentElement = {};

const tokenizer = new Tokenizer(xmlStr, {
  text: (stats) => {
    ast.addChild(new Element('text', stats));
  },

  comment: (stats) => {
    console.table(stats);
  },

  cdata: (stats) => {
    console.table(stats);
  },

  elementOpen: (stats) => {
    console.table(stats);
  },

  attributeName: (stats) => {
    console.table(stats);
  },

  attributeValue: (stats) => {
    console.table(stats);
  },

  elementClose: (stats) => {
    console.table(stats);
  }
});
tokenizer.parse();
