import fs from 'fs';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

enum State {
  Uninit,

  // element
  elemOpenBegin, // <
  elemOpen,
  elemOpenEnd, // >

  elemCloseBegin, // < || /
  elemClose,
  elemCloseEnd, // >

  // attribute
  attrNameStart,
  attrName,
  attrNameEnd,

  attrEqual, // =

  attrLeftSQuotes, // '
  attrRightSQuotes, // '

  attrLeftDQuotes, // "
  attrRightDQuotes, // "

  attrValueStart,
  attrValue,
  attrValueEnd,

  // text
  text,

  // blank
  blank,
}
class Parser {
  index: number = -1;
  row: number = -1;
  column: number = -1;
  current: string = '';
  elemStack: string[] = [];

  state: State = State.Uninit;

  constructor() {

  }

  emit(eventName: string, args?: any) {
    console.info(eventName, ':', args);
  }

  parse(str: string): void {
    const len: number = str.length;
    while (++this.index < len) {
      var char = str[this.index];
      // console.info(char);
      if (char === '<') {
        if (this.state === State.Uninit) {
          this.state = State.elemOpenBegin;
          continue;
        }

        if (this.state === State.elemOpenEnd) {
          this.state = State.elemOpenBegin
        }
      }
      if (char === '>') {
        if (this.state === State.attrNameStart) {
          this.state = State.elemOpenEnd;
          this.emit('elementOpenEnd', this.elemStack[this.elemStack.length - 1]);
          this.current = '';

          while (++this.index < len) {
            char = str[this.index];
            if (char !== '<') {
              this.current += char;
            } else {
              this.emit('text', this.current);
              --this.index;
              break;
            }
          }
          continue;
        }

        if (this.state === State.elemClose) {
          if (this.current !== this.elemStack[this.elemStack.length - 1]) {
            this.emit('error', `No close element: ${this.current}`);
          }
          this.emit('elementEnd', this.current);
          this.current = '';
        }
      }

      if (char === '=') {
        if (this.state === State.attrName) {
          this.emit('attributeName', this.current);
          this.current = '';
          this.state = State.attrValueStart;
          continue;
        }
        if (this.state === State.attrNameEnd) {
          this.state = State.attrValueStart;
          continue;
        }
      }

      if (char === '"') {
        if (this.state === State.attrValueStart) {
          this.state = State.attrLeftDQuotes;
          continue;
        }

        if (this.state === State.attrValue || this.state === State.attrLeftDQuotes) {
          this.emit('attributeValue', this.current);
          this.current = '';
          this.state = State.attrNameStart;
          continue;
        }
      }

      if (char === '\'') {
        if (this.state === State.attrValueStart) {
          this.state = State.attrLeftSQuotes;
          continue;
        }

        if (this.state === State.attrValue || this.state === State.attrLeftSQuotes) {
          this.emit('attributeValue', this.current);
          this.current = '';
          this.state = State.attrNameStart;
          continue;
        }
      }

      if (char === '/') {
        if (this.state === State.elemOpenBegin) {
          this.state = State.elemCloseBegin;
          this.current = '';
          continue;
        }
      }

      // blank char
      if (/[\s\t\n\r]/.test(char)) {
        if (this.state === State.elemOpen) {
          this.emit('elementOpenStart', this.current);
          this.elemStack.push(this.current);
          this.current = '';
          this.state = State.attrNameStart;
          continue;
        }
        if (this.state === State.attrNameStart || this.state === State.attrValueStart) {
          continue;
        }
        if (this.state === State.attrName) {
          this.emit('attributeName', this.current);
          this.current = '';
          this.state = State.attrNameEnd;
          continue;
        }
        if (this.state === State.attrNameEnd) {
          continue;
        }

        if (this.state === State.attrLeftDQuotes || this.state === State.attrLeftSQuotes) {
          this.current += char;
          continue;
        }
      }

      if (/[a-zA-Z-./:]/.test(char)) {
        if (this.state === State.elemOpenBegin) {
          this.state = State.elemOpen;
          this.current = char;
          continue;
        }
        if (this.state === State.elemOpen || this.state === State.attrName) {
          this.current += char;
          continue;
        }
        if (this.state === State.attrNameStart) {
          this.state = State.attrName;
          this.current += char;
          continue;
        }
        if (this.state === State.attrLeftDQuotes || this.state === State.attrLeftSQuotes) {
          this.state = State.attrValue;
          this.current = char;
          continue;
        }

        if (this.state === State.attrValue) {
          this.current += char;
          continue;
        }

        if (this.state === State.elemCloseBegin || this.state === State.elemClose) {
          this.state = State.elemClose;
          this.current += char;
        }
      }
      // console.error('Do not!');
    }
  }
}

const parser = new Parser();
parser.parse(xmlStr);