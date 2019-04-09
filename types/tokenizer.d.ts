interface EventValue {
  index: number,
  startIndex: number,
  column: number,
  row: number,
  value: null | string,
  name?: string, // just for attribute
}

type EventNames = 'elementEnd' | 'elementStart' | 'text' | 'comment' | 'cdata' | 'elementOpen' | 'attributeName' | 'attributeValue' | 'attribute' | 'elementClose' | 'error' | 'end';

type Events = {
  [propName in EventNames]?: (opts: EventValue, err?: Error) => void;
}