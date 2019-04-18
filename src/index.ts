import fs from 'fs';
import { Document } from './node';
import parser from './parser';
import generator from './generator';

// const xmlStr: string = fs.readFileSync('./src/template', 'utf8');
// const ast: Document = parser.parse(xmlStr);
// const newXmlStr: string = generator.generate(ast, { format: true });

export { parser, generator };
