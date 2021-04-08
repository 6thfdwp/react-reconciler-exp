import { scheduleUpdate } from '../fiber-reconciler/render';

export default class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }

  setState(partialState) {
    this.state = Object.assign({}, this.state, partialState);
    // Naive and dirty way 
    if (this._internalInstance) {
      // state update for stack reconciler 
      this._internalInstance.receive(this._internalInstance.currentElement);
    }  else {
      // for fiber 
      scheduleUpdate(this, partialState);
    }

  }

  setInternalInstance(internal) {
    this._internalInstance = internal;
  }
}

Component.isClassComponent = true;
export function createInstance(fiber) {
  const instance = new fiber.type(fiber.props);
  instance.__fiber = fiber;
  return instance;
}
