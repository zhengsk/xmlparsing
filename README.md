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

类型：string

节点类型：document、element、fragment、text、comment、cdata 类型


### nodeValue

类型：string | null

节点值：Text节点、Comment节点、Cdata节点的文本内容，其他节点的nodeValue为null


### children [Node]

所有子节点数组


### parentNode

父节点

### previousSibling

前一个兄弟节点

### previousElementSibling

前一个兄弟元素节点

### nextSibling

后一个兄弟节点


### nextElementSibling

后一个兄弟元素节点


### firstChild

第一个子节点


### lastChild

最后一个子节点


### outerXML

节点字符串文本

### innerXML

所有子节点的字符串文本

## 方法

### getAttribute(attributName)
说明：获取属性值

参数：attributeName 属性名

```js
// <div class="hello" />
node.getAttribute('class'); // 'hello'
```

### setAttribute(attributeName, newValue)

说明： 设置属性值

参数： attributeName 属性名， newValue 属性值

```js
// <div class="hello" />
node.getAttribute('class', 'green');
node.getAttribute('id', 'abc'); // <div class="green" id="abc"></div>

```

### removeAttribute(attributeName)

说明： 删除节点属性

参数： attributeName

```js
// <div class="hello" />
node.removeAttribute('class');
node.getAttribute('id', 'abc'); // <div></div>
```

### hasAttribute

说明： 判断节点是否有纯在的属性

参数： attributeName

```js
// <div class="hello" />
node.removeAttribute('class');
node.getAttribute('id', 'abc'); // <div></div>
```

### appendChild(childNode)

说明： 添加子节点

参数： childNode

```js
// <div class="hello" />
node.removeAttribute('class');
const newNode = node.createElement('xyz');
node.appendChild(newNode); // <div class="hello"><xyz></xyz></div>
```

### insertBefore(newNode, referenceNode)

说明： 在参考节点前插入节点

参数： newNode 新节点，referenceNode 参考相关节点

### insertAfter(newNode, referenceNode)

说明： 在参考节点后插入节点


### before

说明：在节点前添加新节点

### after

说明：在节点后添加新节点

### removeChild

说明：删除子节点

### replaceWith

说明：用新节点替换节点本身

### remove

说明：删除节点本身

### empty

说明：清空节点所有子节点

### cloneNode

说明：克隆节点本身

### toString

说明：返回节点字符串序列

### getElementsByTagName

说明：返回所有指定节点名称的所有子节点

### createElement

说明：创建新元素节点

### createComment

说明：创建注释节点

### createTextNode

说明：创建文本节点

### createFragment

说明：创建片段节点