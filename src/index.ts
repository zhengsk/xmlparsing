import fs from 'fs';
import { Tokenizer } from './tokenizer';

const xmlStr: string = fs.readFileSync('./src/template', 'utf8');

const tokenizer = new Tokenizer(xmlStr, {
  elementClose: (stats) => {
    // console.info(stats.token);
  }
});
tokenizer.parse();
