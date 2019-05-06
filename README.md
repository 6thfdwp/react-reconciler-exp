Focus on learning how reconciler works, compare two main reconciling algorithms: stack reconciler and fiber reconciler, how they transform the element object tree (as input) to another internal representation used for rendering UI.

Fiber implementation also demonstrates the simple scheduling to split traversal across different call stack frames, avoid blocking UI thread. It's like building a linked list incrementally and do DOM operations in one commit.

inspired by https://github.com/pomber/didact and Facebook implementation notes for
[stack reconciler](https://reactjs.org/docs/implementation-notes.html)
