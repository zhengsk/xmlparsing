import { EventValue } from '../types/tokenizer';

type NodeType = 'document' | 'element' | 'text' | 'comment' | 'cdata';
type Func = (key: string, value: string | null) => void;

class Attribute {
  public key: string;
  public value: string | null;

  constructor(key: string, value: string | null) {
    this.key = key;
    this.value = value;
  }

  public get isBoolean(): boolean {
    return this.value === null;
  }

  public setKey(key: string) {
    this.key = key;
  }

  public setValue(value: string) {
    this.value = value;
  }
}

// AttributeList
export class AttributeList {
  [key: string]:
    | string
    | Attribute[]
    | null
    | Func
    | Attribute
    | number
    | object;

  public attributes: Attribute[] = [];
  private object: { [key: string]: Attribute } = {};

  public get length() {
    return this.attributes.length;
  }

  public getIndex(key: string) {
    let index = -1;
    if (this.object.hasOwnProperty(key)) {
      const attri = this.object[key];
      index = this.attributes.indexOf(attri as Attribute);
    }
    return index;
  }

  public has(key: string): boolean {
    return this.getIndex(key) !== -1;
  }

  public get(key: string): Attribute | null {
    if (this.has(key)) {
      return this.object[key] as Attribute;
    }
    return null;
  }

  public set(key: string, value: string | null) {
    const attr = new Attribute(key, value);
    this.attributes.push(attr);
    this.object[key] = attr;
  }

  public remove(key: string): Attribute | null {
    const index = this.getIndex(key);
    let result = null;
    if (index !== -1) {
      delete this.object[key];
      result = this.attributes.splice(index, 1)[0];
    }
    return result;
  }

  public modify(key: string, newKey: string, newValue?: string) {
    const attri = this.get(key);
    if (attri) {
      attri.key = newKey;
      this.object[newKey] = this.object[key];
      delete this.object[key];

      if (newValue) {
        attri.value = newValue;
      }
    }
  }

  public forEach(
    func: (
      attribute: Attribute,
      index: number,
      attributes: Attribute[]
    ) => void,
    context: any = null
  ) {
    this.attributes.forEach((attribute, index, attributes) => {
      func.call(context, attribute, index, attributes);
    });
  }
}

// Node
export class Node {
  public nodeType: NodeType;
  public nodeValue?: string | null = null;

  public attributes?: AttributeList | null;

  public children: Node[] | undefined;
  public parentNode?: Node | null;

  public selfClosing?: boolean;
  public stats?: EventValue;

  constructor(type: NodeType, stats: EventValue) {
    this.nodeType = type;

    this.stats = stats;
  }

  // firstChild
  public get firstChild(): Node | null {
    return (this.children && this.children[0]) || null;
  }

  // lastChild
  public get lastChild(): Node | null {
    return (this.children && this.children[this.children.length - 1]) || null;
  }

  // attribute operator
  public getAttribute(key: string): string | null | undefined {
    let value;
    if (this.attributes && this.attributes.get(key)) {
      value = this.attributes.get(key)!.value;
    }
    return value;
  }

  public setAttribute(key: string, value: string | null) {
    if (!this.attributes) {
      this.attributes = new AttributeList();
    }
    this.attributes.set(key, value);
  }

  public removeAttribute(key: string) {
    if (this.attributes) {
      this.attributes.remove(key);
    }
  }

  public hasAttribute(key: string) {
    return this.attributes && this.attributes.has(key);
  }

  public modifyAttribute(key: string, newKey: string, newValue?: string) {
    if (this.attributes) {
      this.attributes.modify(key, newKey, newValue);
    }
  }

  public forEachAttributes(
    func: (
      attribute: Attribute,
      index: number,
      attributes: Attribute[]
    ) => void,
    context: any = null
  ) {
    if (this.attributes) {
      this.attributes.forEach(func, context);
    }
  }

  // children operate
  public appendChild(node: Node): Node {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(node);
    node.parentNode = this;
    return node;
  }

  // insertBefore
  public insertBefore(newNode: Node, referenceNode: Node | null): Node {
    if (!this.children) {
      this.children = [];
    }
    newNode.parentNode = this;
    // @TODO: should be removed from parentNode chidrens.

    if (referenceNode === null) {
      return this.appendChild(newNode);
    }

    const index = this.children.indexOf(referenceNode);
    this.children.splice(index, 0, newNode);
    return newNode;
  }

  // removeChild
  public removeChild(node: Node): Node {
    if (this.children && this.children.includes(node)) {
      const index = this.children.indexOf(node);
      this.children.splice(index, 1);
      delete node.parentNode;
      return node;
    }
    throw new Error('The node to be removed is not a child of this node.');
  }

  // clone
  public cloneNode(deep: boolean = false): Node {
    // @TODO: implement
    return this;
  }

  // previousSibling
  get previousSibling(): Node | null {
    let node = null;
    if (this.parentNode) {
      const index = this.parentNode.children!.indexOf(this);
      node = this.parentNode.children![index - 1];
    }
    return node;
  }

  // previousElementSibling
  get previousElementSibling(): Element | null {
    let node = this.previousSibling;
    while (node && node.nodeType !== 'element') {
      node = node.previousSibling;
    }
    return node as Element;
  }

  // nextSibling
  get nextSibling(): Node | null {
    let node = null;
    if (this.parentNode) {
      const index = this.parentNode.children!.indexOf(this);
      node = this.parentNode.children![index + 1];
    }
    return node;
  }

  // nextElementSibling
  get nextElementSibling(): Element | null {
    let node = this.nextSibling;
    while (node && node.nodeType !== 'element') {
      node = node.nextSibling;
    }
    return node as Element;
  }

  // getElementsByTagName
  public getElementsByTagName(elementName: string): Element[] {
    const result: Element[] = [];
    this.traverse(element => {
      if (
        element.nodeType === 'element' &&
        (element as Element).tagName === elementName
      ) {
        result.push(element as Element);
      }
    });
    return result;
  }

  // traverse
  public traverse(callback: (node: Node) => void) {
    if (this.children && this.children.length) {
      this.children.forEach(element => {
        callback(element);
        element.traverse(callback); // recursive
      });
    }
  }
}

// Text Node
export class Text extends Node {
  constructor(stats: EventValue) {
    super('text', stats);
    this.nodeValue = stats.value;
  }
}

// Comment Node
export class Comment extends Node {
  constructor(stats: EventValue) {
    super('comment', stats);
    this.nodeValue = stats.value;
  }
}

// Cdata Node
export class Cdata extends Node {
  constructor(stats: EventValue) {
    super('cdata', stats);
    this.nodeValue = stats.value;
  }
}

// Element Node
export class Element extends Node {
  public tagName: string;

  constructor(stats: EventValue) {
    super('element', stats);
    this.tagName = stats!.value!;
  }
}

// Document Node
export class Document extends Node {
  constructor(stats: EventValue) {
    super('document', stats);
  }
}
