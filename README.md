# xmlparsing

> XML解析器，支持布尔属性、自结束标签元素、保持元素属性。

## 安装

```shell
npm i xmlparsing
```

## 使用

```js
import { parser, generator} from 'xmlparsing'

// parse
const xmlDocument = parser.parse('<hello class="red"></hello>');

// firstChild
const helloElement = xmlDocument.firstChild;

// tagName
console.info(helloElement.tagName); // hello

// getAttribute
console.info(helloElement.getAttribute('class')); // red;

helloElement.setAttribute('class', 'green');

// generate
generator.generate(xmlDocument); // <hello class="green"></hello>
```

## 元素类型

* Document
* Element
* Fragment
* Text
* Comment
* Cdata

## 属性

### nodeType

### nodeValue

### children

### parentNode

### previousSibling

### previousElementSibling

### nextSibling

### nextElementSibling

### firstChild

### lastChild

### outerXML

### innerXML

## 方法

### getAttribute

### setAttribute

### removeAttribute

### hasAttribute

### appendChild

### insertBefore

### insertAfter

### before

### after

### removeChild

### replaceWith

### remove

### empty

### cloneNode

### toString

### getElementsByTagName

### createElement

### createComment

### createTextNode

### createFragment