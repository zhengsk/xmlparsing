import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Tokenizer } from '../src/tokenizer';

import { Document, Element, Node } from '../src/node';
import parser from '../src/parser';
import generator from '../src/generator';

describe('Node operate', () => {
  it('Document: firstChild', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    expect(doc.firstChild).eq(doc.children![0]);
    expect(doc.lastChild).eq(doc.children![0]);
  });

  it('Document: lastChild', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc><w />'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    expect((doc.lastChild as Element).tagName).eq('w');
    expect(doc.lastChild).eq(doc.children![1]);
  });

  it('Attribute: get', () => {
    const opts = {
      sourceStr: '<abc b="ab" booleanValue></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    expect(doc.firstChild!.getAttribute('b')).eq('ab');
    expect(doc.firstChild!.getAttribute('w')).eq(undefined);
    expect(doc.firstChild!.getAttribute('booleanValue')).eq(null);
  });

  it('Attribute: has', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    expect(doc.firstChild!.hasAttribute('b')).eq(true);
    expect(doc.firstChild!.hasAttribute('c')).eq(false);
  });

  it('Attribute: length', () => {
    const opts = {
      sourceStr: '<abc x b="ab" w= ></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    expect(doc.firstChild!.attributes!.length).eq(3);
  });

  it('Attribute: set', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>',
      targetStr: '<abc b="ab" class="newClass"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    doc.firstChild!.setAttribute('class', 'newClass');
    const newXmlStr: string = generator.generate(doc, { format: false });
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Attribute: delete', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>',
      targetStr: '<abc></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    doc.firstChild!.removeAttribute('b');
    const newXmlStr: string = generator.generate(doc, { format: false });
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Attribute: modify', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>',
      targetStr: '<abc aaa="aabb"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    doc.firstChild!.modifyAttribute('b', 'bbb');
    doc.firstChild!.modifyAttribute('bbb', 'aaa', 'aabb');
    const newXmlStr: string = generator.generate(doc, { format: false });
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: traverse', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a/><b/><c/><d><e/></d></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const result = [];
    doc.traverse(element => {
      result.push(element);
    });
    expect(result.length).eq(6);
  });

  it('Node: getElementsByTagName', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a/><b/><c/><d><a/></d></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const result = doc.getElementsByTagName('a');
    expect(result.length).eq(2);
  });

  it('Node: removeChild', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a>text</a></abc>',
      targetStr: '<abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const result = doc.getElementsByTagName('a');
    doc.firstChild!.removeChild(result[0]);
    const newXmlStr: string = generator.generate(doc, { format: false });
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: previousSibling', () => {
    const opts = {
      sourceStr: '<hello /><abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const previousSibling = doc.lastChild!.previousSibling;
    expect((previousSibling as Element).tagName).eq('hello');
  });

  it('Node: previousElementSibling', () => {
    const opts = {
      sourceStr: '<hello />abc<abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const previousElementSibling = doc.lastChild!.previousElementSibling;
    expect(previousElementSibling!.tagName).eq('hello');
  });

  it('Node: nextSibling', () => {
    const opts = {
      sourceStr: '<hello />abc<abc b="ab"><w/></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const nextSibling = doc.firstChild!.nextSibling;
    expect(nextSibling!.nodeType).eq('text');
  });

  it('Node: nextElementSibling', () => {
    const opts = {
      sourceStr: '<hello />abc<abc b="ab">xx</abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const nextElementSibling = doc.firstChild!.nextElementSibling;
    expect(nextElementSibling!.tagName).eq('abc');
  });
});
