"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var xmlStr = fs_1.default.readFileSync('./src/template', 'utf8');
var State;
(function (State) {
    State[State["Uninit"] = 0] = "Uninit";
    // element
    State[State["elemOpenStart"] = 1] = "elemOpenStart";
    State[State["elemOpen"] = 2] = "elemOpen";
    State[State["elemOpenEnd"] = 3] = "elemOpenEnd";
    State[State["elemSelfClosing"] = 4] = "elemSelfClosing";
    State[State["elemCloseStart"] = 5] = "elemCloseStart";
    State[State["elemClose"] = 6] = "elemClose";
    State[State["elemCloseEnd"] = 7] = "elemCloseEnd";
    // attribute
    State[State["attrNameStart"] = 8] = "attrNameStart";
    State[State["attrName"] = 9] = "attrName";
    State[State["attrNameEnd"] = 10] = "attrNameEnd";
    State[State["attrEqual"] = 11] = "attrEqual";
    State[State["attrLeftSQuotes"] = 12] = "attrLeftSQuotes";
    State[State["attrRightSQuotes"] = 13] = "attrRightSQuotes";
    State[State["attrLeftDQuotes"] = 14] = "attrLeftDQuotes";
    State[State["attrRightDQuotes"] = 15] = "attrRightDQuotes";
    State[State["attrValueStart"] = 16] = "attrValueStart";
    State[State["attrValue"] = 17] = "attrValue";
    State[State["attrValueEnd"] = 18] = "attrValueEnd";
    // text
    State[State["text"] = 19] = "text";
    // blank
    State[State["blank"] = 20] = "blank";
})(State || (State = {}));
var Location = /** @class */ (function () {
    function Location() {
        this.index = -1;
        this.row = -1;
        this.column = -1;
    }
    return Location;
}());
var Parser = /** @class */ (function () {
    function Parser(str) {
        this.str = '';
        this.index = -1;
        this.row = -1;
        this.column = -1;
        this._rowsSize = []; // every line length
        this.current = '';
        this.elemStack = [];
        this.state = State.elemCloseEnd;
        this.str = str;
    }
    Parser.prototype.emit = function (eventName, args) {
        console.info(eventName, ':', args);
    };
    Parser.prototype.isLineBreak = function (char) {
        if (char === '\n') { // @TODO \r\n
            return true;
        }
        return false;
    };
    Parser.prototype.isEmptyChar = function (char) {
        return /[\s\t\n]/.test(char);
    };
    Parser.prototype.checkWord = function (char) {
        if (/\w/.test(char)) {
            return true;
        }
        else {
            throw new Error('Not valid element name or attribute name!');
        }
    };
    Parser.prototype.checkElemName = function (elemName) {
        if (/^[a-zA-Z$-][\w-$]*$/.test(elemName)) {
            return true;
        }
        throw new Error('Invalid element name!');
    };
    Parser.prototype.checkAttrName = function (elemName) {
        if (/^[a-zA-Z$-][\w-$]*$/.test(elemName)) {
            return true;
        }
        throw new Error('Invalid element name!');
    };
    Parser.prototype.feed = function (size) {
        if (size === void 0) { size = 1; }
        if (size > 0) {
            for (var i = 1; i <= size; i++) {
                this.index += 1;
                var char = this.str[this.index];
                if (this.isLineBreak(char)) {
                    this._rowsSize.push(this.column);
                    this.column = 0;
                    ++this.row;
                }
                else {
                    ++this.column;
                }
            }
        }
        if (size < 0) {
            for (var i = -1; i >= size; i--) {
                this.index -= 1;
                var char = this.str[this.index];
                if (this.isLineBreak(char)) {
                    this.column = this._rowsSize.pop() || 0;
                    --this.row;
                }
                else {
                    --this.column;
                }
            }
        }
        return this.str[this.index];
    };
    Parser.prototype.parse = function () {
        var len = this.str.length;
        while (this.index < len) {
            var char = this.feed();
            // console.info(char);
            // elemCloseEnd
            if (this.state === State.elemCloseEnd) {
                this.current = char;
                if (char === '<') {
                    this.state = State.elemOpenStart;
                    continue;
                }
                this.state = State.text;
                continue;
            }
            // elemOpenStart: <
            if (this.state === State.elemOpenStart) {
                if (this.isEmptyChar(char)) {
                    continue;
                }
                if (char === '/') {
                    this.state = State.elemCloseStart;
                    this.current = '';
                    continue;
                }
                if (this.checkElemName(char)) {
                    this.state = State.elemOpen;
                    this.current = char;
                    while (this.index < len) {
                        char = this.feed();
                        // <a ...> or <a/> or <a>
                        if (this.isEmptyChar(char) || char === '/' || char === '>') {
                            this.elemStack.push(this.current);
                            this.emit('elementOpen', this.current);
                            this.current = '';
                            this.state = State.attrNameStart;
                            break;
                        }
                        if (this.checkElemName(this.current + char)) {
                            this.current += char;
                            continue;
                        }
                    }
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
                    while (this.index < len) {
                        char = this.feed();
                        // <a mn ...> or <a mn= ...> or <a mn/> or <a mn>
                        if (this.isEmptyChar(char) || ['=', '/', '>'].includes(char)) {
                            this.emit('attributeName', this.current);
                            this.state = State.attrNameEnd;
                            this.current = '';
                            break;
                        }
                        if (this.checkAttrName(this.current + char)) {
                            this.current += char;
                            continue;
                        }
                    }
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
                if (char === '/') {
                    this.state = State.elemSelfClosing;
                    continue;
                }
                if (char === '>') {
                    this.state = State.elemOpenEnd;
                    continue;
                }
                // boolean attribute
                this.emit('attributeValue', null);
                this.state = State.attrNameStart;
                continue;
            }
            // attrEqual
            if (this.state === State.attrEqual) {
                if (this.isEmptyChar(char)) {
                    continue;
                }
                if (char === '\'') {
                    this.state = State.attrLeftSQuotes;
                    this.current = '';
                    continue;
                }
                if (char === '"') {
                    this.state = State.attrLeftDQuotes;
                    continue;
                }
                throw new Error('Invalid attribute value!');
                console.error('Invalid attribute value!');
            }
            // attrLeftSQuotes
            if (this.state === State.attrLeftSQuotes) {
                if (char !== "'") {
                    this.current += char;
                    continue;
                }
                this.emit('attributeValue', this.current);
                this.current = '';
                this.state = State.attrNameStart;
            }
            // attrLeftDQuotes
            if (this.state === State.attrLeftDQuotes) {
                if (char !== '"') {
                    this.current += char;
                    continue;
                }
                this.emit('attributeValue', this.current);
                this.current = '';
                this.state = State.attrNameStart;
            }
            // elemSelfClosing
            if (this.state === State.elemSelfClosing) {
                if (this.isEmptyChar(char)) {
                    continue;
                }
                if (char === '>') {
                    var element = this.elemStack.pop();
                    this.emit('elementClose', element);
                    this.state = State.elemCloseEnd;
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
                this.state = State.text;
                continue;
            }
            // text
            if (this.state === State.text) {
                this.current = '';
                while (char !== '<' && this.index < len) {
                    this.current += char;
                    char = this.feed();
                }
                if (this.current.length) {
                    this.emit('text', this.current);
                }
                this.state = State.elemOpenStart;
                continue;
            }
            // elemCloseStart: /
            if (this.state === State.elemCloseStart) {
                if (this.isEmptyChar(char)) {
                    continue;
                }
                // < / >
                if (char === '>') {
                    throw new Error('Empty close tag!');
                    console.error('Empty close tag!');
                }
                while (char !== '>' && this.index < len) {
                    this.current += char;
                    char = this.feed();
                }
                var element = this.elemStack.pop();
                if (element === this.current) {
                    this.emit('elementClose', element);
                    this.state = State.elemCloseEnd;
                    continue;
                }
                else {
                    throw new Error('Can not match close tag!');
                    console.error('Can not match close tag!');
                }
            }
            // console.error('Do not!');
        }
    };
    return Parser;
}());
var parser = new Parser(xmlStr);
parser.parse();
//# sourceMappingURL=index.js.map