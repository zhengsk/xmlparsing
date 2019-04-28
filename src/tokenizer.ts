import { EventNames, EventValue, Events } from '../types/tokenizer';

enum State {
  // text
  text,

  // element
  elemOpenStart, // <
  elemOpenEnd, // >

  elemSelfClosing, // /

  elemCloseStart, // < or /
  elemClose,

  // attribute
  attrNameStart,
  attrName,
  attrNameEnd,

  attrEqual, // =

  attrLeftSQuotes, // '
  attrRightSQuotes, // '

  attrLeftDQuotes, // "
  attrRightDQuotes, // "

  // comment: <!
  comment
}

// class Location {
//   index: number = -1;
//   row: number = -1;
//   column: number = -1;
// }

export class Tokenizer {
  private str: string = '';

  private index: number = -1;
  private startIndexes: number[] = [0]; // strore each element start index

  private row: number = 1;
  private column: number = 0;

  private rowsLength: number[] = []; // line length in each row

  private current: string = '';
  private elemStack: string[] = [];

  private state: State = State.text;
  private maxIndex: number = 0;

  private plainTextNodes: string[] = [];

  private events: Events;

  private attributeValueWithoutQuotes: boolean = true;

  private attributeName: string = ''; // store attribute name waiting for attribute value
  private error?: Error;

  private checkElementName(elemName: string): boolean {
    if (/^[a-zA-Z$-][\w-$:]*$/.test(elemName)) {
      return true;
    }
    return false;
  }

  private checkAttributeName(attrName: string): boolean {
    if (/^[a-zA-Z$_\-:][\w-$:]*$/.test(attrName)) {
      return true;
    }
    return false;
  }

  constructor(
    events: Events,
    options: {
      plainTextNodes?: string[];
      checkElementName?: () => void;
      checkAttributeName?: () => void;
    } = {}
  ) {
    this.events = events;
    Object.assign(this, options);
  }

  private emit(
    eventName: EventNames,
    opts: {
      element?: string;
      booleanValue?: boolean;
      selfClosing?: boolean;
    } = {}
  ) {
    const startIndexMap = ['elementEnd', 'text', 'comment', 'cdata'];
    let startIndex = 0;

    if (startIndexMap.includes(eventName)) {
      startIndex = this.startIndexes.pop()!;
    }

    if (
      this.events[eventName] ||
      (this.events.attribute && eventName === 'attributeValue')
    ) {
      const data: EventValue = {
        index: this.index,
        startIndex,
        column: this.column,
        row: this.row,
        value: this.current
      };

      if (eventName === 'elementClose') {
        data.value = opts!.element!;
        if (opts.selfClosing) {
          data.selfClosing = true;
        }
      } else if (eventName === 'attributeValue' && opts.booleanValue) {
        data.value = null;
      }

      // fire attribute
      if (eventName === 'attributeValue') {
        if (this.events.attributeValue) {
          this.events.attributeValue(data);
        }

        data.name = this.attributeName;
        if (this.events.attribute) {
          this.events.attribute(data);
        }
        this.attributeName = '';

        return false;
      }

      this.events[eventName]!(data, this.error);
      this.error = undefined;
    }
    // console.info(eventName, ':', this.current);
  }

  private isLineBreak(char: string) {
    if (char === '\n') {
      // @TODO \r\n
      return true;
    }
    return false;
  }

  private isEmptyChar(char: string) {
    return /[\s\t\n]/.test(char);
  }

  private checkElemName(elemName: string): boolean {
    const result = this.checkElementName(elemName);
    if (result) {
      return result;
    }
    throw new Error('Invalid element name!');
  }

  private checkAttrName(attrName: string) {
    const result = this.checkAttributeName(attrName);
    if (result) {
      return result;
    }
    throw new Error('Invalid attribute name!');
  }

  private feed(size: number = 1): string {
    if (size > 0) {
      for (let i = 1; i <= size; i++) {
        this.index += 1;
        const char = this.str[this.index];
        if (this.isLineBreak(char)) {
          this.rowsLength.push(this.column);
          this.column = 1;
          ++this.row;
        } else {
          ++this.column;
        }
      }
    }

    if (size < 0) {
      for (let i = -1; i >= size; i--) {
        this.index -= 1;
        const char = this.str[this.index];
        if (this.isLineBreak(char)) {
          this.column = this.rowsLength.pop() || 0;
          --this.row;
        } else {
          --this.column;
        }
      }
    }

    return this.str[this.index];
  }

  // state: text
  private stateText(char: string) {
    this.current = '';
    while (char !== '<') {
      this.current += char;
      if (this.index < this.maxIndex) {
        char = this.feed();
      } else {
        break;
      }
    }

    if (this.current.length) {
      this.emit('text');
    }

    this.state = State.elemOpenStart;
    this.startIndexes.push(this.index);
  }

  // state: elemOpenStart
  private stateElemOpenStart(char: string) {
    if (this.isEmptyChar(char)) {
      return;
    }

    if (char === '/') {
      this.state = State.elemCloseStart;
      return;
    }

    // comment or CDATA element: <!
    if (char === '!') {
      this.current += char; // <!
      const dashOne = this.feed(); // <!-
      const dashTwo = this.feed(); // <!--
      if (dashOne === '-' && dashTwo === '-') {
        // Comment start
        this.current += dashOne + dashTwo;
        this.state = State.comment;

        this.current = '';
        const reg = new RegExp(`-->$`);
        while (!reg.test(this.current) && this.index < this.maxIndex) {
          // @TODO to be optimize
          char = this.feed();
          this.current += char;
        }
        this.current = this.current.replace(reg, '');
        this.emit('comment');
        this.state = State.text;
        this.startIndexes.push(this.index);
        return;
      }

      // <![CDATA[  ... ]]>
      const cdata = '[CDATA['.split('');
      if (dashOne === cdata[0] && dashTwo === cdata[1]) {
        for (let i = 2; i < cdata.length; i++) {
          if (this.index < this.maxIndex) {
            char = this.feed();
            if (char !== cdata[i]) {
              throw new Error('Unexpect character!');
              console.error('Unexpect character!');
            }
          }
        }

        // CDATA value string
        this.current = '';
        const reg = new RegExp(`]]>$`);
        while (!reg.test(this.current) && this.index < this.maxIndex) {
          // @TODO to be optimize
          char = this.feed();
          this.current += char;
        }
        this.current = this.current.replace(reg, '');
        this.emit('cdata');
        this.state = State.text;
        this.startIndexes.push(this.index);
        return;
      }
    }

    if (this.checkElemName(char)) {
      this.current = char;

      while (this.index < this.maxIndex) {
        char = this.feed();
        // <a ...> or <a/> or <a>
        if (this.isEmptyChar(char) || char === '/' || char === '>') {
          this.elemStack.push(this.current);
          this.feed(-1);
          this.emit('elementOpen');
          this.current = '';
          this.state = State.attrNameStart;
          break;
        }

        this.current += char;
        if (this.checkElemName(this.current)) {
          continue;
        }
      }
      return;
    }
  }

  // state: attrNameStart
  private stateAttrNameStart(char: string) {
    if (this.isEmptyChar(char)) {
      return;
    }

    if (char === '>') {
      this.state = State.elemOpenEnd;
      this.current = '';
      return;
    }

    if (char === '/') {
      this.state = State.elemSelfClosing;
      this.current = '';
      return;
    }

    if (this.checkAttrName(char)) {
      this.state = State.attrName;
      this.current = char;

      while (this.index < this.maxIndex) {
        char = this.feed();

        // <a mn ...> or <a mn= ...> or <a mn/> or <a mn>
        if (this.isEmptyChar(char) || ['=', '/', '>'].includes(char)) {
          this.attributeName = this.current;
          this.feed(-1);
          this.emit('attributeName');
          this.current = '';
          this.state = State.attrNameEnd;
          break;
        }

        this.current += char;
        if (this.checkAttrName(this.current)) {
          continue;
        }
      }
      return;
    }
  }

  // state: attrNameEnd
  private stateAttrNameEnd(char: string) {
    if (this.isEmptyChar(char)) {
      return;
    }

    if (char === '=') {
      this.state = State.attrEqual;
      return;
    }

    // boolean attribute
    if (char === '>') {
      this.emit('attributeValue', { booleanValue: true });
      this.state = State.elemOpenEnd;
      return;
    }

    // boolean attribute
    if (char === '/') {
      this.emit('attributeValue', { booleanValue: true });
      this.state = State.elemSelfClosing;
      return;
    }

    // boolean attribute: any other char
    this.emit('attributeValue', { booleanValue: true }); // @TODO wrong index location
    this.state = State.attrNameStart;
    this.feed(-1);
    return;
  }

  // state: attrEqual
  private stateAttrEqual(char: string) {
    if (this.isEmptyChar(char)) {
      return;
    }

    if (char === `'`) {
      this.state = State.attrLeftSQuotes;
      return;
    }

    if (char === '"') {
      this.state = State.attrLeftDQuotes;
      return;
    }

    // support attribute value without quotes.
    if (this.attributeValueWithoutQuotes) {
      while (this.index < this.maxIndex) {
        if (char === '>') {
          this.emit('attributeValue');
          this.current = '';
          this.state = State.text;
          break;
        }

        if (this.isEmptyChar(char)) {
          this.emit('attributeValue');
          this.current = '';
          this.state = State.attrNameStart;
          break;
        }

        if (char === '/') {
          this.emit('attributeValue');
          this.current = '';
          this.state = State.elemSelfClosing;
          break;
        }

        this.current += char;
        char = this.feed();
      }
      return;
    }

    throw new Error('Invalid attribute value!');
    console.error('Invalid attribute value!');
  }

  // state: attrLeftSQuotes or attrLeftDQuotes
  private stateAttrLeftQuotes(char: string) {
    const quote = {
      [State.attrLeftSQuotes]: `'`,
      [State.attrLeftDQuotes]: '"'
    }[this.state as State.attrLeftSQuotes | State.attrLeftDQuotes];

    let isEscape: boolean = false;
    while ((char !== quote || isEscape) && this.index < this.maxIndex) {
      this.current += char;
      isEscape = !isEscape && char === '\\';
      char = this.feed();
    }

    this.emit('attributeValue');
    this.current = '';
    this.state = State.attrNameStart;
    return;
  }

  // state: elemSelfClosing
  private stateElemSelfClosing(char: string) {
    if (this.isEmptyChar(char)) {
      return;
    }

    if (char === '>') {
      const element = this.elemStack.pop();
      this.emit('elementClose', { element, selfClosing: true }); // selfClosing
      this.state = State.text;
      return;
    }

    throw new Error('Invalid char in self-closing element!');
    console.error('Invalid char in self-closing element!');
  }

  // state: elemOpenEnd
  private stateElemOpenEnd(char: string) {
    if (char === '<') {
      this.state = State.elemOpenStart;
      this.startIndexes.push(this.index);
      return;
    }

    // TextNode
    const element = this.elemStack[this.elemStack.length - 1];
    if (this.plainTextNodes.includes(element)) {
      this.current = char;
      const reg = new RegExp(`<\\s*/\\s*${element}\\s*>$`);
      while (!reg.test(this.current) && this.index < this.maxIndex) {
        // @TODO to be optimize
        char = this.feed();
        this.current += char;
      }
      let lastTag = '';
      this.current = this.current.replace(reg, tag => {
        lastTag = tag;
        return '';
      });
      this.feed(-lastTag.length + 1);
      if (this.current.length) {
        this.emit('text');
      }
      this.state = State.elemOpenStart;
      this.startIndexes.push(this.index);
      return;
    }

    this.state = State.text;
    this.feed(-1);
    return;
  }

  // state: stateElemCloseStart
  private stateElemCloseStart(char: string) {
    if (this.isEmptyChar(char)) {
      return;
    }

    // < / >
    if (char === '>') {
      throw new Error('Empty close element!');
      console.error('Empty close element!');
    }

    this.current = '';
    while (char !== '>' && this.index < this.maxIndex) {
      this.current += char;
      if (this.checkElemName(this.current)) {
        char = this.feed();
      }
    }
    const element = this.elemStack.pop();
    if (element === this.current) {
      this.emit('elementClose', { element });
      this.state = State.text;
      this.startIndexes.push(this.index);
      return;
    } else {
      throw new Error('Can not match close element!');
      console.error('Can not match close element!');
    }
  }

  // parse
  public parse(xmlStr: string): void {
    this.str = xmlStr;

    try {
      this.maxIndex = this.str.length - 1;
      while (this.index < this.maxIndex) {
        const char = this.feed();
        // console.info(char);

        // text
        if (this.state === State.text) {
          this.stateText(char);
          continue;
        }

        // elemOpenStart: <
        if (this.state === State.elemOpenStart) {
          this.stateElemOpenStart(char);
          continue;
        }

        // attrNameStart
        if (this.state === State.attrNameStart) {
          this.stateAttrNameStart(char);
          continue;
        }

        // attrNameEnd
        if (this.state === State.attrNameEnd) {
          this.stateAttrNameEnd(char);
          continue;
        }

        // attrEqual
        if (this.state === State.attrEqual) {
          this.stateAttrEqual(char);
          continue;
        }

        // attrLeftSQuotes or attrLeftDQuotes
        if (
          this.state === State.attrLeftSQuotes ||
          this.state === State.attrLeftDQuotes
        ) {
          this.stateAttrLeftQuotes(char);
          continue;
        }

        // elemSelfClosing
        if (this.state === State.elemSelfClosing) {
          this.stateElemSelfClosing(char);
          continue;
        }

        // elemOpenEnd
        if (this.state === State.elemOpenEnd) {
          this.stateElemOpenEnd(char);
          continue;
        }

        // elemCloseStart: /
        if (this.state === State.elemCloseStart) {
          this.stateElemCloseStart(char);
          continue;
        }

        console.error('Can not be here!');
      }
      this.emit('end');
    } catch (err) {
      this.error = err;
      this.emit('error');
      console.error(err);
    }
  }
}
