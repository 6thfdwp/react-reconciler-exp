export default class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }

  setState(partialState) {
    this.state = Object.assign({}, this.state, partialState);
    // reconcile(parentDom, internal, internal.element);
    this._internalInstance.receive(this._internalInstance.currentElement);
  }

  setInternalInstance(internal) {
    this._internalInstance = internal;
  }
}

Component.isClassComponent = true;
