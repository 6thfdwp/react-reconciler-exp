import createElement from './element';
import Component from './component';
import reconcile from './reconciler';

let rootInstance = null;
function render(element, container) {
  const prevInstance = rootInstance;
  const nextInstance = reconcile(container, prevInstance, element);
  rootInstance = nextInstance;
}

export { createElement, Component, render };
