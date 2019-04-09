import fs from 'fs';
import { Tokenizer } from './tokenizer';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

type NodeType = 'document' | 'element' | 'text' | 'comment' | 'cdata';

class Attribute {
  name: string;
  value: string | null;

  constructor(name: string, value: string|null) {
    this.name = name;
    this.value = value;
  }
}

class AttributeList {
  [key: string]: string | null | Map<string, Attribute> | Function;
  attributs: Map<string, Attribute> = new Map();

  get(name: string): string | null {
    if (this.attributs.has(name)) {
      return <string | null>this[name];
    }
    return null;
  }

  set(name: string, value: string | null) {
    const attr = new Attribute(name, value);
    this.attributs.set(name, attr);
    this[name] = value;
  }

  remove(name: string) {
    this.attributs.delete(name);
    delete this[name];
  }
}

class Node {
  nodeType: NodeType;
  nodeValue?: string | null = null;

  _map?: AttributeList | null;
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
    node.parentNode = this;
    return node;
  }

  removeChild(node: Node): Node {
    if (this.children && this.children.includes(node)) {
      const index = this.children.indexOf(node);
      this.children.splice(index, 1);
      delete node.parentNode;
      return node;
    }
    throw new Error('The node to be removed is not a child of this node.');
  }

  // attribute operator
  getAttribute(name: string): string|null {
    if (this._map){
      return <string | null>this._map.get(name)!;
    }
    return null;
  }

  setAttribute(name: string , value: string | null) {
    if (!this._map){
      this._map = new AttributeList();
    }
    this._map.set(name, value);
  }

  removeAttribute(name: string) {
    if (this._map) {
      this._map.remove(name);
    }
  }

  // @TODO
  get previousSibling() {
    return 0;
  }

  // @TODO
  get previousElementSibling() {
    return 0;
  }

  // @TODO
  get nextSibling() {
    return 0;
  }

  // @TODO
  get nextElementSibling() {
    return 0;
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
    currentElement.setAttribute(stats.name!, stats.value!);
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

  error(stats, err) {
    debugger; // eslint-disable-line
  },
});

tokenizer.parse();
