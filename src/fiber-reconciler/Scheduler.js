import { createDomElement, updateDomProperties } from '../core/dom-utils';

const ENOUGH_TIME = 1; // ms

const HOST_ROOT = 'root';
const HOST_COMPONENT = 'host';
const CLASS_COMPONENT = 'class';

const PLACEMENT = 1;
const DELETION = 2;
const UPDATE = 3;

/**
 *
 * The Scheduler mainly controls the flow of fiber creation
 * It relies on Reconciler to produce real fiber object and eastablish their linkage.
 * When all fibers are completed, start commiting effects (DOM ops) at once
 * Effects are essentially flattened fiber object list with effect tag
 * (placement / update / deletion) accumulated during traversal.
 * Check how commitAll leverage this effects list to consctruct final DOM tree
 *
 * The traversal strategy on element object tree is like this:
 *
 *  1. It will go down one level via props.children, build a new fiber for it,
 *     link them through parent - child. Other children will be linked as its sibling
 *     Keep going deep from the first child
 *  2. Once reach the leaf (props.children empty), it then goes to sibling, reconcile its sub-tree
 *  3. When all sibling finish, its parent also marked completed.
 *  4. Back to parent's sibling, repeat the reconciliation
 *
 *  5. Until trace back to root, start commiting phase
 *
 * 1-4 traversal can be split into multi call stack frames, as no recursion / DOM ops involved.
 * Think of it as building linked list incrementally only need to keep a pointer
 * to know where to resume upon browser next idle
 *
 */
export default class Scheduler {
  constructor(Reconciler) {
    this._reconciler = new Reconciler();

    // The reference of next fiber to work on
    // act like the top pointer of call stack frames
    this._nextWork = null;
    this._pendingCommit = null;
    this._updateQueue = [];
  }

  getRoot(fiber) {
    let node = fiber;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }

  resetNextUnitOfWork() {
    const update = this._updateQueue.shift();
    if (!update) {
      return null;
    }

    // Copy the setState parameter from the update payload to the corresponding fiber
    // if (update.partialState) {
    //   update.instance.__fiber.partialState = update.partialState;
    // }
    // const root =
    //   update.from === 'root'
    //     ? update.domContainer._rootContainerFiber
    //     : this.getRoot(update.instance.__fiber);
    // return {
    //   tag: HOST_ROOT,
    //   // if it is by state change, will use previous tree's info
    //   stateNode: update.domContainer || root.stateNode,
    //   props: update.initialProps || root.props,
    //   // previous tree as alternate
    //   alternate: root,
    // };
    let root, fiberTag;
    if (update.from === 'root') {
      root = update.domContainer._rootContainerFiber;
      fiberTag = HOST_ROOT;
    } else {
      // start from fiber where setState is triggered
      root = update.instance.__fiber;
      fiberTag = CLASS_COMPONENT;
    }
    return {
      tag: fiberTag,
      stateNode: update.domContainer || root.stateNode,
      props: update.initialProps || root.props,
      partialState: update.partialState,
      alternate: root,
    };
  }

  get nextUnitOfWork() {
    // if still in the current reconciliation
    if (this._nextWork) return this._nextWork;

    // extract next update to work, could come from component setState
    this._nextWork = this.resetNextUnitOfWork();
    return this._nextWork;
  }

  performWork(deadline) {
    this.workLoop(deadline);
    if (this.nextUnitOfWork) {
      requestIdleCallback(this.performWork.bind(this));
    }
  }

  workLoop(deadline) {
    // let uow = this.nextUnitOfWork;
    while (this.nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
      this._nextWork = this.performUnitOfWork(this.nextUnitOfWork);
    }

    if (this._pendingCommit) {
      this.commitAll();
    }
  }

  _log(fiber) {
    if (!fiber.type) return 'root';
    if (typeof fiber.type == 'string') return fiber.type;

    return fiber.type.name;
  }
  performUnitOfWork(wipFiber) {
    // Reconciler is the one that does real work
    this._reconciler.receive(wipFiber);

    if (wipFiber.child) {
      console.log(`perform ${this._log(wipFiber)} first child`, wipFiber.child);
      return wipFiber.child;
    }
    let node = wipFiber;
    while (node) {
      this.completeWork(node);

      if (node.sibling) {
        console.log(`perform ${this._log(node)} sibling`, node.sibling);
        return node.sibling;
      }
      node = node.parent;
    }
  }

  /**
   * Build effect list for completed fiber, either it is leaf node or all its direct children is done
   * Each fiber's effects are bascically flatterned fiber node list
   * from all its descendents down below.
   * So essentially root has the list ordered like this
   * [
   *   first child (left most at leaf level),
   *   sibling 1, sibling 2..,
   *   parent,
   *   parent sibling..,
   *   grandparent,
   *   ...
   *   root
   * ]
   */
  completeWork(fiber) {
    console.log(`complete work for ${this._log(fiber)}`, fiber);
    if (fiber.tag == CLASS_COMPONENT) {
      fiber.stateNode.__fiber = fiber;
    }

    if (fiber.parent) {
      // console.log(fiber.effects);
      const childEffects = fiber.effects || [];
      // make itself one of effect
      const thisEffect = fiber.effectTag ? [fiber] : [];

      // merged with fiber parent's existing effects (from previous siblings)
      const parentEffects = fiber.parent.effects || [];
      fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
    } else {
      // when traverse back to root fiber, mark it as pending commit,
      // ready to kick off commit phase
      this._pendingCommit = fiber;
    }
  }

  commitWork(fiber) {
    if (fiber.tag == HOST_ROOT || !fiber.parent) {
      return;
    }

    let parentFiber = fiber.parent;
    // class component does not involve dom ops
    // search tree up until find a host dom element
    while (parentFiber && parentFiber.tag === CLASS_COMPONENT) {
      parentFiber = parentFiber.parent;
    }
    if (!parentFiber) return;

    let domParent = parentFiber.stateNode;
    // let domParentFiber = fiber.parent;
    // while (domParentFiber.tag == CLASS_COMPONENT) {
    //   domParentFiber = domParentFiber.parent;
    // }
    // const domParent = domParentFiber.stateNode;

    if (fiber.effectTag == PLACEMENT && fiber.tag == HOST_COMPONENT) {
      domParent.appendChild(fiber.stateNode);
    } else if (fiber.effectTag == UPDATE) {
      updateDomProperties(fiber.stateNode, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag == DELETION) {
      this.commitDeletion(fiber, domParent);
    }
  }

  commitDeletion(fiber, domParent) {
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

  commitAll() {
    let fiber = this._pendingCommit;
    fiber.effects.forEach(f => {
      this.commitWork(f);
    });
    if (fiber.tag === HOST_ROOT) fiber.stateNode._rootContainerFiber = fiber;
    this._nextWork = null;
    this._pendingCommit = null;
  }

  start(update) {
    this._updateQueue.push(update);
    requestIdleCallback(this.performWork.bind(this));
  }

  receiveUpdate(instance, partialState) {
    console.log(`receive update:`, partialState);
    this._updateQueue.push({
      from: CLASS_COMPONENT,
      instance,
      partialState,
    });
    requestIdleCallback(this.performWork.bind(this));
  }
}
