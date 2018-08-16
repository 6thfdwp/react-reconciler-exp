import { updateDomProperties } from './dom-utils';

export default function reconcile(parentDom, prevInstance, nextElement) {
  // if it's first render or nextElement children's length at some level down the tree
  // is more than previous rendered instances,
  if (!prevInstance) {
    const instance = instantiate(nextElement);
    parentDom.appendChild(instance.dom);
    return instance;
  }
  if (!nextElement) {
    parentDom.removeChild(prevInstance.dom);
    return null;
  }

  const prevElement = prevInstance.element;
  if (prevElement.type !== nextElement.type) {
    const nextInstance = instantiate(nextElement);
    parentDom.replaceChild(nextInstance.dom, prevInstance.dom);
    return nextInstance;
  } else {
    // reuse dom node for current type level if type is the same
    if (typeof prevElement.type == 'string') {
      // update raw dom instance
      updateDomProperties(prevInstance.dom, prevElement.props, nextElement.props);

      const children = reconcileChildren(prevInstance, nextElement);
      prevInstance.childInstances = children;
      prevInstance.element = nextElement;
      return prevInstance;
    } else {
      // reuse component instance (public instance)
      // reconcile the trunk of element it is wrapping
      prevInstance.publicInstance.props = nextElement.props;
      // use latest props and state to re-render
      const nextChild = prevInstance.publicInstance.render();
      const prevChildInstance = prevInstance.childInstance;
      const nextChildInstance = reconcile(parentDom, prevChildInstance, nextChild);

      prevInstance.dom = nextChildInstance.dom;
      prevInstance.childInstance = nextChildInstance;
      prevInstance.element = nextElement;
      return prevInstance;
    }
  }
}

function reconcileChildren(instance, element) {
  const parentDom = instance.dom;
  // leaf node instance's children is [], see instantiate
  const childInstances = instance.childInstances,
    // if element is text node, no children prop
    children = element.props.children || [];
  const nextChildInstances = [];

  const count = Math.max(childInstances.length, children.length);
  for (let i = 0; i < count; i++) {
    const nextChild = reconcile(parentDom, childInstances[i], children[i]);
    nextChildInstances.push(nextChild);
  }
  return nextChildInstances;
}

function createPublicInstance(element, internalInstance) {
  const { type, props } = element;
  const publicInstance = new type(props);
  publicInstance.__internalInstance = internalInstance;
  // publicInstance.
  return publicInstance;
}
// function updatePublicInstance(element, internalInstance) {
//   const publicInstance = internalInstance.publicInstance;
//   // set new props from new render
//   publicInstance.props = element.props;
//   return publicInstance.render();
// }

// DOM hierarchy cosntruction, represent element been rendered into DOM
function instantiate(element) {
  const { type, props } = element;
  const isDomElement = typeof type === 'string';

  if (isDomElement) {
    // Create DOM element
    const isTextElement = type === 'TEXT ELEMENT';
    const dom = isTextElement ? document.createTextNode('') : document.createElement(type);

    // attach props to new dom node
    updateDomProperties(dom, [], props);

    // Instantiate and append children
    const childElements = props.children || [];
    const childInstances = childElements.map(instantiate);
    const childDoms = childInstances.map(childInstance => childInstance.dom);
    childDoms.forEach(childDom => dom.appendChild(childDom));

    const instance = { dom, element, childInstances };
    return instance;
  } else {
    // Instantiate component element for curtom JSX tag
    const instance = {};
    const publicInstance = createPublicInstance(element, instance);
    const childElement = publicInstance.render();
    if (element.type.name == 'StoryList') console.log(childElement);

    // what's wrapped inside render returned as single child instance of the component
    const childInstance = instantiate(childElement);
    const dom = childInstance.dom;
    // if (element.type.name == 'StoryLike') console.log(childInstance);

    // element = {type: Component, props:{}}
    // dom is html trunk returned by Component
    // childInstance is raw dom instance format
    Object.assign(instance, { dom, element, childInstance, publicInstance });
    return instance;
  }
}
