import fs from 'fs';
import { Tokenizer } from './tokenizer';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

type NodeType = 'document' | 'element' | 'text' | 'comment' | 'cdata';

class Node {
  nodeType: NodeType;
  nodeValue?: string | null = null;

  attributes?: Map<string, string>;
  children: Node[] | undefined;

  parentNode?: Node | null;

  stats?: EventValue;

  constructor(type: NodeType, stats: EventValue) {
    this.nodeType = type;
    
    this.stats = stats;
  }

  appendChild(node: Node): Node {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(node);
    return node;
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

class Text extends Node {
  constructor(stats: EventValue) {
    super('text', stats);
    this.nodeValue = stats.value;
  }
}

class Comment extends Node {
  constructor(stats: EventValue) {
    super('comment', stats);
    this.nodeValue = stats.value;
  }
}

class Cdata extends Node {
  constructor(stats: EventValue) {
    super('cdata', stats);
    this.nodeValue = stats.value;
  }
}

class Element extends Node {
  tagName: string;

  constructor(stats: EventValue) {
    super('element', stats);
    this.tagName = stats!.value!;
  }
}

class Document extends Node{
  type: NodeType = 'document';
  children: Element[] = [];
}


const ast = new Document('document', {
  value: 'docuement',
  index: 0,
  startIndex: 0,
  column: 1,
  row: 1,
});

const elementStack: Node[] = [];
let currentElement: Node = ast;


const tokenizer = new Tokenizer(xmlStr, {
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
    currentElement.setAttribute(stats.key!, stats.value!);
  },

  elementClose(stats) {
    currentElement = elementStack.pop()!;
    console.info(ast);
    // debugger; // eslint-disable-line
  },

  end(){
    // debugger; // eslint-disable-line
    console.info(ast);
  },

  error(stats) {
    debugger; // eslint-disable-line
  },
});

tokenizer.parse();
