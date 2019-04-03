import {expect} from 'chai';
import { describe, it } from 'mocha';
import {Tokenizer} from '../src/tokenizer';


describe('Test', function() {
  it('Shoud ok', () => {
    const tokenizer = new Tokenizer("<a href='33' />", {
      elementOpen(token) {
        expect(token.value).to.equal('a');
      },
      elementClose(token) {
        expect(token.value).to.equal('a');
      },
      attributeName(token) {
        expect(token.value).to.equal('href');
      },
      attributeValue(token) {
        expect(token.value).to.equal('33');
      }
    });
    tokenizer.parse();
  }); 
});
