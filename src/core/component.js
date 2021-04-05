import { scheduleUpdate } from '../fiber-reconciler/render';

export default class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }

  setState(partialState) {
    this.state = Object.assign({}, this.state, partialState);
    // this._internalInstance.receive(this._internalInstance.currentElement);

    scheduleUpdate(this, partialState);
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
