import { createDomElement, updateDomProperties } from '../core/dom-utils';

// factory to choose which interal used to mount actual node
export default function instantiateComponent(element) {
  var type = element.type;
  if (typeof type === 'function') {
    // User-defined components
    let comp = new CompositeComponent(element);
    if (type.name == 'StoryLike') {
      console.log(comp);
    }
    return comp;
  } else if (typeof type === 'string') {
    // Platform-specific components
    return new DOMComponent(element);
  }
}

/**
 * Wrapper to host and mount acutal DOM node for the element 
 * Here reconciliation and DOM construction kind of interleave   
 * when its mount finishes, we also have the DOM hierarchy built for this element and its entire subtree
 */
class DOMComponent {
  constructor(element) {
    this.currentElement = element;
    // the wrapper instance of each child element
    // could be DOMComponent or CompositeComponent
    this.renderedChildren = [];
    // dom node corresponding to this element
    this.node = null;
  }

  getHostNode() {
    return this.node;
  }

  // The mount is more like reconciling and DOM rendering combined 
  mount() {
    const { type, props } = this.currentElement;
    let children = props.children || [];

    // transform raw element to platform specific node with
    // props set as attributes and event handler attached
    const node = createDomElement(this.currentElement);
    this.node = node;
    children.forEach((childEle) => {
      // Recursively check the children
      // Each child could be either DOM host or composite host instance
      let childInstance = instantiateComponent(childEle);
      this.renderedChildren.push(childInstance);

      // if child is a DOM host instance, it recursively calls this mount 
      // if child is composite host instance, it calls Composite.mount until it reaches another dom element
      // and get into DOMComponent.mount again 
      let childNode = childInstance.mount();
      // DOM Ops: all children nodes mounted onto current level of element 
      node.appendChild(childNode);
    });
    return node;
  }

  //
  receive(nextElement) {
    let { type, props: nextProps } = nextElement;
    let {
      currentElement: prevElement,
      renderedChildren: prevRenderedChildren,
    } = this;
    // update current level node
    updateDomProperties(this.node, prevElement.props, nextProps);

    let nextChildren = nextProps.children,
      nextRenderedChildren = [];
    // In real, here is way more complicated to handle children more efficiently, reorder, insert
    // now we have brutle force algorithm to only compare child in the same position
    for (let i = 0, len = nextChildren.length; i < len; i++) {
      if (!prevRenderedChildren[i]) {
        // mount nextChildren[i], it's new node
        let nextInstance = instantiateComponent(nextChildren[i]);
        nextRenderedChildren.push(nextInstance);
        this.node.appendChild(nextInstance.mount());
        continue;
      }

      let canUpdate =
        prevRenderedChildren[i].currentElement.type == nextChildren[i].type;
      if (!canUpdate) {
        // mount a new node by replace
        // let prevNode = this.node;
        // let nextRendered = instantiateComponent(nextChildren[i]);
        // let nextNode = nextRendered.mount();
        // this.node = nextNode
        // nextRenderedChildren.push(nextRendered);
        continue;
      }
      // can reuse
      prevRenderedChildren[i].receive(nextChildren[i]);
      nextRenderedChildren.push(prevRenderedChildren[i]);
    }

    //TODO nextChildren is less than prevRenderedChildren (removed)

    this.currentElement = nextElement;
    this.renderedChildren = nextRenderedChildren;
  }
}

/**
 *  Wrapper to mount custom component (defined by function or class)
 *  It does not mount acutal DOM node but execute the 'render' method or functional component
 *  Use the returned element object tree (representing the component structure) to recursively
 *  mount underlying DOM node which is done by DOMComponent host 
 **/
class CompositeComponent {
  /**
   *
   *  @param {object} element: {type, props}
   *  @param {?array-like} args: children of current element
   **/
  constructor(element) {
    this.currentElement = element;
    // reference to another CompositeComponent instance or DOMComponent instance
    this.renderedComponent = null;
    this.publicInstance = null;
  }

  getPublicInstance() {
    return this.publicInstance;
  }

  getHostNode() {
    // possibly recursive until down to the underlying DOMComponent
    return this.renderedComponent.getHostNode();
  }

  _doRender({ type, props }) {
    let publicInstance, renderedElement;
    if (type.isClassComponent) {
      publicInstance = new type(props);
      renderedElement = publicInstance.render();
      // simply for setState
      publicInstance.setInternalInstance(this);
    } else {
      renderedElement = type(props);
      publicInstance = null;
    }
    this.publicInstance = publicInstance;

    return renderedElement;
  }

  mount() {
    const { type, props } = this.currentElement;
    // Object.keys(props).filter(k != 'children')
    let publicInstance, renderedElement;
    renderedElement = this._doRender(this.currentElement);
    this.renderedComponent = instantiateComponent(renderedElement);

    return this.renderedComponent.mount();
  }

  unmount() {
    //
  }

  receive(nextElement) {
    let { type, props: nextProps } = nextElement;
    let {
      currentElement,
      publicInstance,
      renderedComponent: prevRenderedComponent,
    } = this;

    let prevRenderedEl = prevRenderedComponent.currentElement;
      // nextRenderedElement;
    let nextRenderedElement = this._doRender(nextElement);
    this.currentElement = nextElement;
    // if (type.isClassComponent) {
    //   publicInstance.props = nextProps;
    //   nextRenderedElement = publicInstance.render();
    // } else {
    //   nextRenderedElement = type(nextProps);
    // }
    if (prevRenderedEl.type === nextRenderedElement.type) {
      // reuse internal and delegate the update to it, recursion again
      return this.renderedComponent.receive(nextRenderedElement);
    }

    // this.unmount();
    // re-instantiate and mount the whole subtree
    let prevNode = this.getHostNode();
    // nextRenderedElement = this._doRender(nextElement);
    //
    this.renderedComponent = instantiateComponent(nextRenderedElement);
    let nextNode = this.renderedComponent.mount();
    prevNode.parentNode.replaceChild(nextNode, prevNode);
  }
}
