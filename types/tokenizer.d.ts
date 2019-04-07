interface EventValue {
  index: number,
  startIndex: number,
  column: number,
  row: number,
  value: null | string,
}

type EventNames = 'elementEnd' | 'elementStart' | 'text' | 'comment' | 'cdata' | 'elementOpen' | 'attributeName' | 'attributeValue' | 'elementClose';

type Events = {
  [propName in EventNames]?: (opts: EventValue) => void;
}