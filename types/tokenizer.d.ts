export interface EventValue {
  index?: number;
  startIndex?: number;
  column?: number;
  row?: number;
  value?: null | string;
  name?: string; // just for attribute
  selfClosing?: boolean;
}

export type EventNames =
  | 'elementEnd'
  | 'elementStart'
  | 'text'
  | 'comment'
  | 'cdata'
  | 'elementOpen'
  | 'attributeName'
  | 'attributeValue'
  | 'attribute'
  | 'elementClose'
  | 'error'
  | 'end';

export type Events = {
  [propName in EventNames]?: (opts: EventValue, err?: Error) => void
};

export type GenerateOptions = {
  format?: string | boolean;
  attributeNewline?: boolean | number;
};
