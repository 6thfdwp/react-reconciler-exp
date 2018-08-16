import createElement from './element';
import Component from './component';
// import reconcile from './reconciler';

import mountTree from './reconciler/mount';

// let rootInstance = null;
// function render(element, container) {
//   const prevInstance = rootInstance;
//   const nextInstance = reconcile(container, prevInstance, element);
//   rootInstance = nextInstance;
// }

let render = mountTree;

export { createElement, Component, render };
