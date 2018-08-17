/*
 * @Author: daer
 * @Date: 2018-08-17 21:39:55
 * @Last Modified by:   daer
 * @Last Modified time: 2018-08-17 21:39:55
 */

export const NODE_TYPES = {
  ELEM: 1,
  ATTR: 2,
  TEXT: 3,
  COMM: 8,
};

export class Local {
  constructor() {
    this.line = null;
    this.column = null;
    this.startIndex = null;
    this.endIndex = null;
  }
}

export class Attr {
  constructor(key, value) {
    this.index = null; // Attribue index in source code.
    this.key = key;
    this.value = value;
  }
}
export class Text {
  constructor(data) {
    this.data = data;
  }
}

export class Comm {
  constructor(data, local) {
    this.data = data;
    this.local = local;
  }
}

export class Elem {
  constructor() {
    this.children = [];
    this.attr = {};
  }
}
