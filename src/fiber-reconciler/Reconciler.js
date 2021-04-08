import { createDomElement, updateDomProperties } from '../core/dom-utils';

const HOST_COMPONENT = 'host';
const CLASS_COMPONENT = 'class';

const PLACEMENT = 1;
const DELETION = 2;
const UPDATE = 3;

export default class Reconciler {
  /**
   *
   * @param {Object} wipFiber: 
   *  this is actually nextUnitOfWork from Scheduler workloop 
   *  when browser main thread becomes idle, Reconciler can resume executing, 
   *  continue walking the element object tree down under
   */
  receive(wipFiber) {
    if (wipFiber.tag === CLASS_COMPONENT) {
      let instance = wipFiber.stateNode;
      if (!instance) {
        instance = wipFiber.stateNode = new wipFiber.type(wipFiber.props);
        instance.__fiber = wipFiber;
      } else if (wipFiber.props == instance.props && !wipFiber.partialState) {
        // current fiber does not receive new props and no state change
        // so no need to render
        this.cloneChildren(wipFiber);
        return;
      }
      instance.props = wipFiber.props;
      // instance.state = Object.assign({}, instance.state, wipFiber.partialState);
      // console.log(instance.state);
      wipFiber.partialState = null;

      const newChildElements = instance.render();

      this.reconcileChildren(wipFiber, newChildElements);
    } else {
      if (!wipFiber.stateNode) {
        wipFiber.stateNode = createDomElement(wipFiber);
      }

      this.reconcileChildren(wipFiber, wipFiber.props.children);
    }
  }

  /**
   * Tranform children elements to new fiber and establish the linkage
   * @wipFiber nextUnitOfWork from Scheduler workloop
   */
  reconcileChildren(wipFiber, childEls) {
    const elements = childEls
      ? Array.isArray(childEls)
        ? childEls
        : [childEls]
      : [];
    let index = 0;

    let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
    let newFiber = null;

    while (index < elements.length || oldFiber != null) {
      const prevFiber = newFiber;
      const element = index < elements.length && elements[index];
      const sameType = oldFiber && element && element.type == oldFiber.type;

      if (sameType) {
        // update with new props
        newFiber = {
          type: oldFiber.type,
          tag: oldFiber.tag,
          stateNode: oldFiber.stateNode,
          props: element.props,
          parent: wipFiber,
          alternate: oldFiber,
          partialState: oldFiber.partialState,
          effectTag: UPDATE,
        };
      } else if (element) {
        // construct new fiber with new element
        newFiber = {
          type: element.type,
          tag:
            typeof element.type === 'string' ? HOST_COMPONENT : CLASS_COMPONENT,
          props: element.props,
          parent: wipFiber,
          effectTag: PLACEMENT,
        };
      }
      // delete
      if (oldFiber && !sameType) {
        oldFiber.effectTag = DELETION;
        wipFiber.effects = wipFiber.effects || [];
        wipFiber.effects.push(oldFiber);
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      if (index == 0) {
        wipFiber.child = newFiber;
      } else if (prevFiber && element) {
        prevFiber.sibling = newFiber;
      }
      index += 1;
    }
  }

  cloneChildren(parentFiber) {
    const oldFiber = parentFiber.alternate;
    if (!oldFiber.child) {
      return;
    }

    let oldChild = oldFiber.child;
    let prevChild = null;
    while (oldChild) {
      const newChild = {
        type: oldChild.type,
        tag: oldChild.tag,
        stateNode: oldChild.stateNode,
        props: oldChild.props,
        partialState: oldChild.partialState,
        alternate: oldChild,
        parent: parentFiber,
      };
      if (prevChild) {
        prevChild.sibling = newChild;
      } else {
        parentFiber.child = newChild;
      }
      prevChild = newChild;
      oldChild = oldChild.sibling;
    }
  }
}
