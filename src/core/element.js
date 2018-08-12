export const TEXT_ELEMENT = 'TEXT ELEMENT';

/**
 * type: element type
 **/
export default function createElement(type, config, ...args) {
  const props = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  props.children = rawChildren
    .filter(c => c != null && c !== false)
    .map(c => (c instanceof Object ? c : createTextElement(c)));
  return { type, props };
}

// for string as direct children <li>value</li>
// return as element object {type:'TEXT_ELEMENT', props:{nodeValue:'value'}}
function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}
