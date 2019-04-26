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
      targetStr: '<abc b="newAb" class="newClass"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    doc.firstChild!.setAttribute('class', 'newClass');
    doc.firstChild!.setAttribute('b', 'newAb');
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Attribute: delete', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>',
      targetStr: '<abc></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    doc.firstChild!.removeAttribute('b');
    const newXmlStr: string = generator.generate(doc);
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
    const newXmlStr: string = generator.generate(doc);
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

  it('Node: appendChild', () => {
    const opts = {
      sourceStr: '<abc b="ab"></abc>',
      targetStr: '<abc b="ab"><a/></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const abcElem = doc.getElementsByTagName('abc')[0];
    const aElem = doc.createElement('a');
    aElem.selfClosing = true;
    abcElem.appendChild(aElem);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: insertBefore', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a>text</a></abc>',
      targetStr: '<a>text</a><abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const aElem = doc.getElementsByTagName('a')[0];
    const abcElem = doc.getElementsByTagName('abc')[0];
    doc.insertBefore(aElem, abcElem);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: insertAfter', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a>text</a></abc>',
      targetStr: '<abc b="ab"></abc><a>text</a>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const aElem = doc.getElementsByTagName('a')[0];
    const abcElem = doc.getElementsByTagName('abc')[0];
    doc.insertAfter(aElem, abcElem);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: removeChild', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a>text</a></abc>',
      targetStr: '<abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const result = doc.getElementsByTagName('a');
    doc.firstChild!.removeChild(result[0]);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: remove', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a>text</a><x/></abc>',
      targetStr: '<abc b="ab"><x/></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const aElem = doc.getElementsByTagName('a')[0];
    aElem.remove();
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: empty', () => {
    const opts = {
      sourceStr: '<abc b="ab"><a>text</a><x/></abc>',
      targetStr: '<abc b="ab"></abc>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const aElem = doc.getElementsByTagName('abc')[0];
    aElem.empty();
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  // create element
  it('Node: createElement', () => {
    const opts = {
      sourceStr: '<hello/>',
      targetStr: '<hello/><a x="33"></a>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const aElem = doc.createElement('a');
    aElem.setAttribute('x', '33');
    doc.appendChild(aElem);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: createTextNode', () => {
    const opts = {
      sourceStr: '<hello/>',
      targetStr: '<hello>text text</hello>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const textElem = doc.createTextNode('text text');
    doc.firstChild!.appendChild(textElem);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: createComment', () => {
    const opts = {
      sourceStr: '<hello/>',
      targetStr: '<hello><!--comment text--></hello>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const commentElem = doc.createComment('comment text');
    doc.firstChild!.appendChild(commentElem);
    const newXmlStr: string = generator.generate(doc);
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: createFragment', () => {
    const opts = {
      sourceStr: '<hello/>',
      targetStr: '<hello><!--comment text--></hello>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const fragmentElem = doc.createFragment();
    const commentElem = doc.createComment('comment text');
    fragmentElem.appendChild(commentElem);
    doc.firstChild!.appendChild(fragmentElem);
    const newXmlStr: string = generator.generate(doc);
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

  it('Node: forEachAttribute', () => {
    const opts = {
      sourceStr: '<hello a=3 b c=4 d="5" />'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const helloElement = doc.firstChild!;
    helloElement.forEachAttributes((attribute, index) => {
      if (index === 0) {
        expect(attribute.key).eq('a');
        expect(attribute.value).eq('3');
      }

      if (index === 3) {
        expect(attribute.key).eq('d');
        expect(attribute.value).eq('5');
      }
    });
  });

  // Node toString
  it('Node: toString', () => {
    const opts = {
      sourceStr: '<hello><a x="33"/><!--comment text--></hello>',
      targetStr: '<hello><a x="33"/><!--comment text--></hello>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const newXmlStr = doc.toString();
    expect(newXmlStr).eq(opts.targetStr);

    const aStr = doc
      .getElementsByTagName('a')[0]
      .toString({ attributeNewline: true });
    expect(aStr).eq('<a\n  x="33"\n/>');
  });

  it('Node: innerXML', () => {
    const opts = {
      sourceStr: '<hello><a x="33"/><!--comment text--></hello>',
      targetStr: '<abc x="33"/>'
    };

    const doc: Document = parser.parse(opts.sourceStr);

    expect(doc.innerXML).eq(opts.sourceStr);

    doc.innerXML = '<abc x="33"/>';
    const newXmlStr = doc.toString();
    expect(newXmlStr).eq(opts.targetStr);
  });

  it('Node: outerXML', () => {
    const opts = {
      sourceStr: '<hello><world><a x="33"/><!--comment text--></world></hello>',
      targetStr: '<world><a x="33"/><!--comment text--></world>'
    };

    const doc: Document = parser.parse(opts.sourceStr);
    const worldElem = doc.getElementsByTagName('world')[0];
    expect(worldElem.outerXML).eq(opts.targetStr);

    worldElem.outerXML = 'abc<br/>';
    expect(doc.outerXML).eq('<hello>abc<br/></hello>');
  });
});
