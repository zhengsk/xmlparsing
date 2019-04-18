import { EventValue } from '../types/tokenizer';

type NodeType = 'document' | 'element' | 'text' | 'comment' | 'cdata';
type Func = (name: string, value: string | null) => void;


// AttributeList
export class AttributeList {
    [key: string]: string | Map<string, string | null> | null | Func;
    public attributs: Map<string, string | null> = new Map();

    public get(name: string): string | null {
        if (this.attributs.has(name)) {
            return this[name] as string | null;
        }
        return null;
    }

    public set(name: string, value: string | null) {
        this.attributs.set(name, value);
        this[name] = value;
    }

    public remove(name: string) {
        this.attributs.delete(name);
        delete this[name];
    }
}

// Node
export class Node {
    public nodeType: NodeType;
    public nodeValue?: string | null = null;

    public attributs?: AttributeList | null;

    public children: Node[] | undefined;
    public parentNode?: Node | null;

    public selfClosing?: boolean;
    public stats?: EventValue;

    constructor(type: NodeType, stats: EventValue) {
        this.nodeType = type;

        this.stats = stats;
    }

    // attribute operator
    public getAttribute(name: string): string | null {
        if (this.attributs) {
            return this.attributs.get(name)! as string | null;
        }
        return null;
    }

    public setAttribute(name: string, value: string | null) {
        if (!this.attributs) {
            this.attributs = new AttributeList();
        }
        this.attributs.set(name, value);
    }

    public removeAttribute(name: string) {
        if (this.attributs) {
            this.attributs.remove(name);
        }
    }

    // firstChild
    public get firstChild(): Node | null {
        return (this.children && this.children[0]) || null;
    }

    // lastChild
    public get lastChild(): Node | null {
        return (this.children && this.children[this.children.length - 1]) || null;
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

    // previousSibling
    get previousSibling(): Node | null {
        const node = null;
        if (this.parentNode) {
            const index = this.parentNode.children!.indexOf(this);
            return this.parentNode.children![index - 1] || node;
        }
        return node;
    }

    // previousElementSibling
    get previousElementSibling(): Element | null {
        let node = null;
        do {
            node = this.previousSibling;
        } while (node && node.nodeType !== 'element');
        return node as Element;
    }

    // nextSibling
    get nextSibling(): Node | null {
        const node = null;
        if (this.parentNode) {
            const index = this.parentNode.children!.indexOf(this);
            return this.parentNode.children![index + 1] || node;
        }
        return node;
    }

    // nextElementSibling
    get nextElementSibling(): Element | null {
        let node = null
        do {
            node = this.nextSibling;
        } while (node && node.nodeType !== 'element');
        return node as Element;
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