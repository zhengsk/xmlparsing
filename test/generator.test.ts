import { expect } from 'chai';
import { describe, it } from 'mocha';

import { Document } from '../src/node';
import parser from '../src/parser';
import generator from '../src/generator';

function itCase(
  opts: {
    title: string;
    sourceStr: string;
    targetStr: string;
  },
  generateOpts: {
    format: boolean | string;
    attributeNewline?: boolean | number;
  } = {
    format: false,
    attributeNewline: false
  },
  parserOpts: {
    plainTextNodes?: string[];
    ignoreWhitespace?: boolean;
  } = {
    plainTextNodes: ['style', 'script'],
    ignoreWhitespace: true
  }
) {
  it(opts.title, () => {
    const ast: Document = parser.parse(opts.sourceStr, parserOpts);
    const newXmlStr: string = generator.generate(ast, generateOpts);

    expect(newXmlStr).eq(opts.targetStr);
  });
}

describe('Generator', () => {
  itCase({
    title: 'Empty xml',
    sourceStr: '',
    targetStr: ''
  });

  itCase({
    title: 'Element xml',
    sourceStr: '<a></a>',
    targetStr: '<a></a>'
  });

  itCase({
    title: 'Element xml multiple line',
    sourceStr: `<a>
    <b>
      < c x=33 />
      <d  xyz/>
    </b>
</a>`,
    targetStr: '<a><b><c x="33"/><d xyz/></b></a>'
  });

  // Attribute
  itCase({
    title: 'Element width attribute',
    sourceStr: '<abc b = "hello"></abc>',
    targetStr: '<abc b="hello"></abc>'
  });

  itCase({
    title: 'Element width attribute escape',
    sourceStr: '<abc b="hello\\""></abc>',
    targetStr: '<abc b="hello\\""></abc>'
  });

  itCase({
    title: 'Element attribute without quotes',
    sourceStr: '<abc a=33><b xx= abc yy= efg/></abc>',
    targetStr: '<abc a="33"><b xx="abc" yy="efg"/></abc>'
  });

  itCase({
    title: 'Child element',
    sourceStr: '<a><br/></a>',
    targetStr: `<a><br/></a>`
  });

  // format
  itCase(
    {
      title: 'format xml',
      sourceStr: '<a><br/></a>',
      targetStr: `<a>\n  <br/>\n</a>`
    },
    {
      format: true
    }
  );

  itCase(
    {
      title: 'format xml without children',
      sourceStr: '<a></a>',
      targetStr: `<a></a>`
    },
    {
      format: true
    }
  );

  itCase(
    {
      title: 'format with tab',
      sourceStr: '<a><br/></a>',
      targetStr: `<a>\n\t<br/>\n</a>`
    },
    {
      format: '\t'
    }
  );

  itCase(
    {
      title: 'format with attributeNewline',
      sourceStr: '<a x="33"><br/></a>',
      targetStr: `<a\n  x="33"\n>\n  <br/>\n</a>`
    },
    {
      format: true,
      attributeNewline: true
    }
  );

  itCase(
    {
      title: 'format with attributeNewline >= 2',
      sourceStr: '<a x="33"><br/></a><w a="x" b="y" />',
      targetStr: `<a x="33">\n  <br/>\n</a>\n<w\n  a="x"\n  b="y"\n/>`
    },
    {
      format: true,
      attributeNewline: 2
    }
  );

  // self-closing
  itCase({
    title: 'Self-closing',
    sourceStr: '<a/>',
    targetStr: '<a/>'
  });

  itCase({
    title: 'Plain text',
    sourceStr: 'abc',
    targetStr: 'abc'
  });

  itCase({
    title: 'Coment ',
    sourceStr: '<!-- abc -->',
    targetStr: '<!-- abc -->'
  });

  itCase({
    title: 'Cdata ',
    sourceStr: '<![CDATA[ cdata content ]]>',
    targetStr: '<![CDATA[ cdata content ]]>'
  });

  itCase({
    title: 'style ',
    sourceStr: '<style id="33">console.infoasdf<a""sd>sad</aw></style>',
    targetStr: '<style id="33">console.infoasdf<a""sd>sad</aw></style>'
  });

  itCase({
    title: 'script ',
    sourceStr: '<script type="texts">console.info("<a""sd>sad</aww>")</script>',
    targetStr: '<script type="texts">console.info("<a""sd>sad</aww>")</script>'
  });

  itCase({
    title: 'end tagName width whitespace',
    sourceStr: '<abc></abc >',
    targetStr: '<abc></abc>'
  });

  itCase({
    title: 'selfclosing tagName width whitespace',
    sourceStr: '<abc / >',
    targetStr: '<abc/>'
  });

  // ignoreWhitespace
  itCase(
    {
      title: 'ignoreWhitespace false to keep',
      sourceStr: '<abc/> <dee/> ',
      targetStr: '<abc/> <dee/> '
    },
    undefined,
    {
      ignoreWhitespace: false
    }
  );
});
