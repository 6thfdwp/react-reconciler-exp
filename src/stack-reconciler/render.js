import instantiateComponent from './instantiate';

export default function render(element, container) {
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
  // first time call to render
  const rootComp = instantiateComponent(element);
  const rootNode = rootComp.mount();
  // console.log(rootComp);
  rootNode._internalInstance = rootComp;
  container.appendChild(rootNode);

  // return rootComp.getPublicInstance();
}

function unmountTree(container) {
  const rootNode = container.firstChild;
  const rootComp = rootNode._internalInstance;
  rootComp.unmount();
  container.removeChild(rootNode);
}
