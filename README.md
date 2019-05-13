# xmlparsing

> XML解析器，支持布尔属性、自结束标签元素、保持元素属性。

## 安装

```shell
npm i xmlparsing
```

## 使用

```js
import { parser, generator} from 'xmlparsing'

const xmlObject = parser('<hello class="red"></hello>');

// firstChild
const helloElement = xmlObject.firstChild;

// tagName
console.info(helloElement.tagName); // hello

// getAttribute
console.info(helloElement.getAttribute('class')); // red;
```

## 属性


## 方法