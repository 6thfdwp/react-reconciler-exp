export const TEXT_ELEMENT = 'TEXT ELEMENT';

/**
 *  This will be used by babel loader to transpile JSX into nested function calls 
 *  eventually forms the element object tree
 *
 *  @param {string|function} type: 
 *        either dom el 'div', 'span' etc. or custom component
 *  @param {object} config: properties speficied in JSX
 *        like style, onClick..
 *  @param {?array-like} args: children of current element
 **/
export default function createElement(type, config, ...args) {
  const props = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  props.children = rawChildren
    .filter(Boolean)
    .map(c => (c instanceof Object ? c : createTextElement(c)));
  return { type, props };
}

// for string as direct children <li>value</li>
// return as element object {type:'TEXT_ELEMENT', props:{nodeValue:'value'}}
function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}
