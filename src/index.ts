import fs from 'fs';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

enum State {
  // text
  text,

  // element
  elemOpenStart, // <
  elemOpenEnd, // >

  elemSelfClosing, // /

  elemCloseStart, // < || /
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

  attrValueStart,
  attrValue,
  attrValueEnd,

  // comment: <!
  comment,
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

  _rowsLength: number[] = []; // line length in each row

  current: string = '';
  elemStack: string[] = [];

  state: State = State.text;

  textNode: string[] = ['script', 'style'];

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
    return /[\s\t\n]/.test(char);
  }

  checkWord(char: string): boolean {
    if (/\w/.test(char)) {
      return true;
    } else {
      throw new Error('Not valid element name or attribute name!');
    }
  }

  checkElemName(elemName: string): boolean {
    if (/^[a-zA-Z$-][\w-$:]*$/.test(elemName)) {
      return true;
    }
    throw new Error('Invalid element name!');
  }

  checkAttrName(elemName: string) {
    if (/^[a-zA-Z$-_:][\w-$:]*$/.test(elemName)) {
      return true;
    }
    throw new Error('Invalid attribute name!');
  }



  feed(size: number = 1): string {
    if (size > 0) {
      for (let i = 1; i <= size; i++) {
        this.index += 1;
        const char = this.str[this.index];
        if (this.isLineBreak(char)) {
          this._rowsLength.push(this.column);
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
          this.column = this._rowsLength.pop() || 0;
          --this.row;
        } else {
          --this.column
        }
      }
    }

    return this.str[this.index];
  }


  parse(): void {
    const maxIndex: number = this.str.length - 1;
    while (this.index < maxIndex) {
      let char = this.feed();
      // console.info(char);

      // text
      if (this.state === State.text) {
        this.current = '';
        while (char !== '<' && this.index < maxIndex) {
          this.current += char;
          char = this.feed();
        }
        if (this.current.length) {
          this.emit('text', this.current);
        }
        this.state = State.elemOpenStart;
        continue
      }

      // elemOpenStart: <
      if (this.state === State.elemOpenStart) {
        if (this.isEmptyChar(char)) {
          continue;
        }

        if (char === '/') {
          this.state = State.elemCloseStart;
          continue;
        }

        // comment element: <!
        if (char === '!') {
          this.current += char; // <!
          const dashOne = this.feed(); // <!-
          const dashTwo = this.feed(); // <!--
          if(dashOne === '-' && dashTwo === '-') {
            // Comment start
            this.current += dashOne + dashTwo;
            this.state = State.comment;

            this.current = '';
            const reg = new RegExp(`-->$`);
            while (!reg.test(this.current) && this.index < maxIndex) { // @TODO to be optimize
              char = this.feed();
              this.current += char;
            }
            this.current = this.current.replace(reg, '');
            this.emit('comment', this.current);
            this.state = State.text;
            continue;

          } else {
            throw new Error('Invalid element name!');
            console.error('Invalid element name!');
          }

        }

        if (this.checkElemName(char)) {
          this.current = char;

          while (this.index < maxIndex) {
            char = this.feed();
            // <a ...> or <a/> or <a>
            if (this.isEmptyChar(char) || char === '/' || char === '>') {
              this.elemStack.push(this.current);
              this.feed(-1);
              this.emit('elementOpen', this.current);
              this.current = '';
              this.state = State.attrNameStart;
              break;
            }

            this.current += char;
            if (this.checkElemName(this.current)) {
              continue;
            }
          }
          continue;
        }
      }

      // attrNameStart
      if (this.state === State.attrNameStart) {
        if (this.isEmptyChar(char)) {
          continue;
        }

        if (char === '>') {
          this.state = State.elemOpenEnd;
          this.current = '';
          continue;
        }

        if (char === '/') {
          this.state = State.elemSelfClosing;
          this.current = '';
          continue;
        }

        if (this.checkAttrName(char)) {
          this.state = State.attrName;
          this.current = char;

          while (this.index < maxIndex) {
            char = this.feed();

            // <a mn ...> or <a mn= ...> or <a mn/> or <a mn>
            if (this.isEmptyChar(char) || ['=', '/', '>'].includes(char)) {
              this.feed(-1);
              this.emit('attributeName', this.current);
              this.current = '';
              this.state = State.attrNameEnd;
              break;
            }

            this.current += char;
            if (this.checkAttrName(this.current)) {
              continue;
            }
          }
          continue;
        }
      }

      // attrNameEnd
      if (this.state === State.attrNameEnd) {
        if (this.isEmptyChar(char)) {
          continue;
        }

        if (char === '=') {
          this.state = State.attrEqual;
          continue;
        }

        // boolean attribute
        if (char === '>') {
          this.emit('attributeValue', null);
          this.state = State.elemOpenEnd;
          continue;
        }

        // boolean attribute
        if (char === '/') {
          this.emit('attributeValue', null);
          this.state = State.elemSelfClosing;
          continue;
        }

        // boolean attribute: any other char
        this.emit('attributeValue', null); // @TODO wrong index location
        this.state = State.attrNameStart;
        this.feed(-1);
        continue;
      }

      // attrEqual
      if (this.state === State.attrEqual) {
        if (this.isEmptyChar(char)) {
          continue;
        }

        if (char === '\'') {
          this.state = State.attrLeftSQuotes;
          continue
        }

        if (char === '"') {
          this.state = State.attrLeftDQuotes;
          continue
        }

        throw new Error('Invalid attribute value!');
        console.error('Invalid attribute value!');
      }

      // attrLeftSQuotes or attrLeftDQuotes
      if (this.state === State.attrLeftSQuotes || this.state === State.attrLeftDQuotes) {
        const quotes = {
          [State.attrLeftSQuotes]: "'",
          [State.attrLeftDQuotes]: '"'
        }[this.state];

        let isEscape: boolean = false;
        while ((char !== quotes || isEscape) && this.index < maxIndex) {
          this.current += char;
          isEscape = !isEscape && char === '\\';
          char = this.feed();
        }

        this.emit('attributeValue', this.current);
        this.current = '';
        this.state = State.attrNameStart;
        continue;
      }

      // elemSelfClosing
      if (this.state === State.elemSelfClosing) {
        if (this.isEmptyChar(char)) {
          continue;
        }

        if (char === '>') {
          const element = this.elemStack.pop();
          this.emit('elementClose', element); // selfClosing
          this.state = State.text;
          continue;
        }

        throw new Error('Invalid char in self-closing element!');
        console.error('Invalid char in self-closing element!');
      }


      // elemOpenEnd
      if (this.state === State.elemOpenEnd) {
        if (char === "<") {
          this.state = State.elemOpenStart;
          continue;
        }

        // TextNode
        const element = this.elemStack[this.elemStack.length - 1];
        if (this.textNode.includes(element)) {
          this.current = char;
          const reg = new RegExp(`<\\s*/\\s*${element}\\s*>$`);
          while (!reg.test(this.current) && this.index < maxIndex) { // @TODO to be optimize
            char = this.feed();
            this.current += char;
          }
          let lastTag = '';
          this.current = this.current.replace(reg, tag => {
            lastTag = tag;
            return '';
          })
          this.feed(-lastTag.length + 1);
          if (this.current.length) {
            this.emit('text', this.current);
          }
          this.state = State.elemOpenStart;
          continue
        }

        this.state = State.text;
        this.feed(-1);
        continue;
      }

      // elemCloseStart: /
      if (this.state === State.elemCloseStart) {
        if (this.isEmptyChar(char)) {
          continue;
        }

        // < / >
        if (char === '>') {
          throw new Error('Empty close element!');
          console.error('Empty close element!');
        }

        this.current = '';
        while (char !== '>' && this.index < maxIndex) {
          this.current += char;
          if (this.checkElemName(this.current)){
            char = this.feed();
          }
        }
        const element = this.elemStack.pop();
        if (element === this.current) {
          this.emit('elementClose', element);
          this.state = State.text;
          continue;
        } else {
          throw new Error('Can not match close element!');
          console.error('Can not match close element!');
        }
      }

      console.error('Can not be here!');
    }


  }
}

const parser = new Parser(xmlStr);
parser.parse();