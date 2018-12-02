/**
 * all done, its effects will be concatenated to its parent as well
 * basically each fiber's effects are its descendents, all child and sibling flatterned
 *
 *        root: props:{children: <App >} WIP
 *          | loop1 unit
 *       type: App
 *          | loop2
 *       StoryLike
 *          | loop3
 *        <li>
 *          |    sibling
 *     <button> -------> <a>
 *        | |            |
 *       text          text
 *
 */

import { createDomElement, updateDomProperties } from '../core/dom-utils';
import { createInstance } from '../core/component';

// Fiber tags
const HOST_COMPONENT = 'host';
const CLASS_COMPONENT = 'class';
const HOST_ROOT = 'root';

// Effect tags
const PLACEMENT = 1;
const DELETION = 2;
const UPDATE = 3;

const ENOUGH_TIME = 1;

// Global state
const updateQueue = [];
let nextUnitOfWork = null;
let pendingCommit = null;

/**
 * element is the root component to mount
 */
export function render(element, containerDom) {
  updateQueue.push({
    from: HOST_ROOT,
    dom: containerDom,
    newProps: { children: element },
  });
  // console.log(elements);
  requestIdleCallback(performWork);
}

export function scheduleUpdate(instance, partialState) {
  updateQueue.push({
    from: CLASS_COMPONENT,
    instance: instance,
    partialState: partialState,
  });
  requestIdleCallback(performWork);
}

function performWork(deadline) {
  workLoop(deadline);
  // nextUnitOfWork refers to the last fiber produced
  // and used to produce next one
  if (nextUnitOfWork || updateQueue.length > 0) {
    requestIdleCallback(performWork);
  }
}

let counter = 0;
function workLoop(deadline) {
  if (!nextUnitOfWork) {
    // first time render or a new state update is triggered
    // to produce the root nextUnitOfWork
    resetNextUnitOfWork();
  }
  while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    // counter += 1;
    // console.log(`work loop: ${counter}`);
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
}

function resetNextUnitOfWork() {
  const update = updateQueue.shift();
  if (!update) {
    return;
  }

  // Copy the setState parameter from the update payload to the corresponding fiber
  if (update.partialState) {
    update.instance.__fiber.partialState = update.partialState;
  }

  const root =
    update.from == HOST_ROOT
      ? update.dom._rootContainerFiber
      : getRoot(update.instance.__fiber);

  // this served as the root fiber
  nextUnitOfWork = {
    tag: HOST_ROOT,
    // first time render stateNode is DOM container
    stateNode: update.dom || root.stateNode,
    // first time render props contains children which is top component
    props: update.newProps || root.props,
    alternate: root,
  };
  console.log('start', nextUnitOfWork);
}

function getRoot(fiber) {
  let node = fiber;
  while (node.parent) {
    node = node.parent;
  }
  return node;
}

function _logFiber(fiber) {
  if (!fiber.type) return fiber.tag;
  if (typeof fiber.type == 'string') return fiber.type;
  return fiber.type.name;
}
function performUnitOfWork(wipFiber) {
  beginWork(wipFiber);
  if (wipFiber.child) {
    console.log(`${_logFiber(wipFiber)} first child`, wipFiber.child);
    return wipFiber.child;
  }

  // No child, we call completeWork until we find a sibling
  let uow = wipFiber;
  while (uow) {
    completeWork(uow);
    if (uow.sibling) {
      // Sibling needs to beginWork
      console.log(`${_logFiber(uow)} sibling`, uow.sibling);
      return uow.sibling;
    }
    uow = uow.parent;
  }
}

function beginWork(wipFiber) {
  if (wipFiber.tag == CLASS_COMPONENT) {
    updateClassComponent(wipFiber);
  } else {
    updateHostComponent(wipFiber);
  }
}

function updateHostComponent(wipFiber) {
  if (!wipFiber.stateNode) {
    wipFiber.stateNode = createDomElement(wipFiber);
  }

  // when wipFiber is root, the children is top level component e.g <App />
  const newChildElements = wipFiber.props.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

function updateClassComponent(wipFiber) {
  let instance = wipFiber.stateNode;
  if (instance == null) {
    // Call class constructor
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if (wipFiber.props == instance.props && !wipFiber.partialState) {
    // No need to render, clone children from last time
    cloneChildFibers(wipFiber);
    return;
  }

  instance.props = wipFiber.props;
  instance.state = Object.assign({}, instance.state, wipFiber.partialState);
  wipFiber.partialState = null;

  const newChildElements = wipFiber.stateNode.render();
  reconcileChildrenArray(wipFiber, newChildElements);
}

function arrify(val) {
  return val == null ? [] : Array.isArray(val) ? val : [val];
}

/**
 * Transform childElements to new fiber
 * link wipFiber to the parent of the first child
 * other children will be linked as sibling
 */
function reconcileChildrenArray(wipFiber, newChildElements) {
  const elements = arrify(newChildElements);

  let index = 0;
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newFiber = null;
  while (index < elements.length || oldFiber != null) {
    const prevFiber = newFiber;
    const element = index < elements.length && elements[index];
    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
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
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        tag:
          typeof element.type === 'string' ? HOST_COMPONENT : CLASS_COMPONENT,
        props: element.props,
        parent: wipFiber,
        effectTag: PLACEMENT,
      };
    }

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

    index++;
  }
}

function cloneChildFibers(parentFiber) {
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

function completeWork(fiber) {
  console.log(`complete work for ${_logFiber(fiber)}`);
  if (fiber.tag == CLASS_COMPONENT) {
    fiber.stateNode.__fiber = fiber;
  }

  if (fiber.parent) {
    const childEffects = fiber.effects || [];
    const thisEffect = fiber.effectTag != null ? [fiber] : [];
    const parentEffects = fiber.parent.effects || [];
    fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
    console.log(fiber.effects);
  } else {
    pendingCommit = fiber;
  }
}

function commitAllWork(fiber) {
  fiber.effects.forEach(f => {
    commitWork(f);
  });
  fiber.stateNode._rootContainerFiber = fiber;
  nextUnitOfWork = null;
  pendingCommit = null;
}

function commitWork(fiber) {
  if (fiber.tag == HOST_ROOT) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (domParentFiber.tag == CLASS_COMPONENT) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.stateNode;

  if (fiber.effectTag == PLACEMENT && fiber.tag == HOST_COMPONENT) {
    domParent.appendChild(fiber.stateNode);
  } else if (fiber.effectTag == UPDATE) {
    updateDomProperties(fiber.stateNode, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag == DELETION) {
    commitDeletion(fiber, domParent);
  }
}

function commitDeletion(fiber, domParent) {
  let node = fiber;
  while (true) {
    if (node.tag == CLASS_COMPONENT) {
      node = node.child;
      continue;
    }
    domParent.removeChild(node.stateNode);
    while (node != fiber && !node.sibling) {
      node = node.parent;
    }
    if (node == fiber) {
      return;
    }
    node = node.sibling;
  }
}
