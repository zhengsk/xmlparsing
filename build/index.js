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
var Parser = /** @class */ (function () {
    function Parser() {
        this.index = -1;
        this.row = -1;
        this.column = -1;
        this.current = '';
        this.elemStack = [];
        this.state = State.Uninit;
    }
    Parser.prototype.emit = function (eventName, args) {
        console.info(eventName, ':', args);
    };
    Parser.prototype.parse = function (str) {
        var len = str.length;
        while (++this.index < len) {
            var char = str[this.index];
            // console.info(char);
            if (char === '<') {
                if (this.state === State.Uninit) {
                    this.state = State.elemOpenBegin;
                    continue;
                }
                if (this.state === State.elemOpenEnd) {
                    this.state = State.elemOpenBegin;
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
                        }
                        else {
                            this.emit('text', this.current);
                            --this.index;
                            break;
                        }
                    }
                    continue;
                }
                if (this.state === State.elemClose) {
                    if (this.current !== this.elemStack[this.elemStack.length - 1]) {
                        this.emit('error', "No close element: " + this.current);
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
    };
    return Parser;
}());
var parser = new Parser();
parser.parse(xmlStr);
//# sourceMappingURL=index.js.map