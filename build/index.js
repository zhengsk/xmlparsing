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
    State[State["elemOpenBegin"] = 1] = "elemOpenBegin";
    State[State["elemOpen"] = 2] = "elemOpen";
    State[State["elemOpenEnd"] = 3] = "elemOpenEnd";
    State[State["elemCloseBegin"] = 4] = "elemCloseBegin";
    State[State["elemClose"] = 5] = "elemClose";
    State[State["elemCloseEnd"] = 6] = "elemCloseEnd";
    // attribute
    State[State["attrNameStart"] = 7] = "attrNameStart";
    State[State["attrName"] = 8] = "attrName";
    State[State["attrNameEnd"] = 9] = "attrNameEnd";
    State[State["attrEqual"] = 10] = "attrEqual";
    State[State["attrLeftSQuotes"] = 11] = "attrLeftSQuotes";
    State[State["attrRightSQuotes"] = 12] = "attrRightSQuotes";
    State[State["attrLeftDQuotes"] = 13] = "attrLeftDQuotes";
    State[State["attrRightDQuotes"] = 14] = "attrRightDQuotes";
    State[State["attrValueStart"] = 15] = "attrValueStart";
    State[State["attrValue"] = 16] = "attrValue";
    State[State["attrValueEnd"] = 17] = "attrValueEnd";
    // text
    State[State["text"] = 18] = "text";
    // blank
    State[State["blank"] = 19] = "blank";
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
        this.state = State.Uninit;
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
        return /[\s\t]/.test(char);
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
                        }
                        else {
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
    };
    return Parser;
}());
var parser = new Parser(xmlStr);
parser.parse();
//# sourceMappingURL=index.js.map