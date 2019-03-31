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

class Location {
  index: number = -1;
  row: number = -1;
  column: number = -1;
}

class Parser {
  str: string = '';

  index: number = -1;
  row: number = -1;
  column: number = -1;

  _rowsSize: number[] = []; // every line length

  current: string = '';
  elemStack: string[] = [];

  state: State = State.Uninit;

  constructor(str: string) {
    this.str = str;
  }

  emit(eventName: string, args?: any) {
    console.info(eventName, ':', args);
  }

  isLineBreak(char: string) {
    if (char === '\n') { // @TODO \r\n
      return true;
    }
    return false;
  }

  isEmptyChar(char: string) {
    return /[\s\t]/.test(char);
  }

  feed(size: number = 1): string {
    if (size > 0) {
      for (let i = 1; i <= size; i++) {
        this.index += 1;
        const char = this.str[this.index];
        if (this.isLineBreak(char)) {
          this._rowsSize.push(this.column);
          this.column = 0;
          ++this.row;
        } else {
          ++this.column
        }
      }
    }

    if (size < 0) {
      for (let i = -1; i >= size; i--) {
        this.index -= 1;
        const char = this.str[this.index];
        if (this.isLineBreak(char)) {
          this.column = this._rowsSize.pop() || 0;
          --this.row;
        } else {
          --this.column
        }
      }
    }

    return this.str[this.index];
  }


  parse(): void {
    const len: number = this.str.length;
    while (this.index < len) {
      let char = this.feed();
      // console.info(char);

      if (this.state === State.Uninit && char !== '<') {
        this.state = State.text;
        this.current = char;

        while (this.index < len) {
          char = this.feed();
          if (char === '<') {
            this.emit('text', this.current);
            this.feed(-1);
            break;
          }
          this.current += char;
        }
        continue;
      }

      // <
      if (char === '<') {
        if (this.state === State.Uninit) {
          this.state = State.elemOpenBegin;
          continue;
        }

        if (this.state === State.elemOpenEnd) {
          this.state = State.elemOpenBegin;
          continue;
        }
      }

      // >
      if (char === '>') {
        if (this.state === State.attrNameStart) {
          this.state = State.elemOpenEnd;
          this.emit('elementOpenEnd', this.elemStack[this.elemStack.length - 1]);
          this.current = '';

          while (this.index < len) {
            char = this.feed();
            if (char !== '<') {
              this.current += char;
            } else {
              if (this.current.length) {
                this.emit('text', this.current);
                this.current = '';
              }
              this.feed(-1);
              break;
            }
          }
          continue;
        }
      }

      // =
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

      // "
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

      // '
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

      // /
      if (char === '/') {
        if (this.state === State.elemOpenBegin) {
          this.state = State.elemCloseBegin;
          this.current = '';

          while (this.index < len) {
            char = this.feed();
            if (char === '>') {
              this.emit('elementClose', this.current);
              this.current = '';
              this.state = State.elemCloseEnd;
              break;
            }
            if (!this.isEmptyChar(char)) {
              this.current += char;
            }
          }
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

      // others
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

      }
      // console.error('Do not!');
    }
  }
}

const parser = new Parser(xmlStr);
parser.parse();