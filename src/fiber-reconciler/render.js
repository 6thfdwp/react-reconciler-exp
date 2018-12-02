import Scheduler from './Scheduler';
import Reconciler from './Reconciler';

const scheduler = new Scheduler(Reconciler);

export function render(element, dom) {
  // const scheduler = new Scheduler(Reconciler);
  scheduler.start({
    from: 'root',
    domContainer: dom,
    initialProps: { children: element },
  });
}

export function scheduleUpdate(instance, partialState) {
  scheduler.receiveUpdate(instance, partialState);
}
