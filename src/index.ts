import fs from 'fs';
import { Document } from './node';
import parser from './parser';
import generator from './generator';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

const ast: Document = parser.parse(xmlStr);
console.info(ast);

const newXmlStr: string = generator.generate(ast, { format: true });

debugger; // tslint:disable-line
