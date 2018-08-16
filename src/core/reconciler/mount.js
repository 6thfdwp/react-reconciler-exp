import { createDomElement } from '../dom-utils';

import instantiateComponent from './instantiate';

/***
 *
 **/
export default function mountTree(element, container) {
  if (container.children.length > 1) {
    const prevRootNode = container.children[1];
    const prevRootComp = prevRootNode._internalInstance;
    if (prevRootComp.currentElement.type === element.type) {
      // start diffing and reconcile again
      prevRootComp.receive(element);
      return;
    }
    // otherwise drop whole app, remount again
    unmountTree(container);
  }
  const rootComp = instantiateComponent(element);
  const rootNode = rootComp.mount();
  // console.log(rootComp);
  rootNode._internalInstance = rootComp;
  container.appendChild(rootNode);
  // why return this guy?
  return rootComp.getPublicInstance();
}

function unmountTree(container) {
  const rootNode = container.firstChild;
  const rootComp = rootNode._internalInstance;
  rootComp.unmount();
  container.removeChild(rootNode);
}
