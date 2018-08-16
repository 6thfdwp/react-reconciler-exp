// import reconcile from './reconciler';

export default class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }

  setState(partialState) {
    this.state = Object.assign({}, this.state, partialState);
    // const internal = this.__internalInstance;
    // const parentDom = internal.dom.parentNode;
    // console.log(parentDom);
    // console.log(internal);
    // reconcile(parentDom, internal, internal.element);
  }

  // internal is from instantiate with {dom, element, childInstance, componentItself}
  setInternalInstance(internal) {}
}

Component.isClassComponent = true;
