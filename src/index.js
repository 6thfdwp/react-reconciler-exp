/** @jsx createElement */
import { createElement, render } from './core/didact';

import render from './stack-reconciler/render'
import {render as fiberRender} from './fiber-reconciler/render'
import App from './app';


  const onChangeReconciler = (e) => {
    const {id, checked} = e.target;
    const tab1Container = document.getElementById('tab1-container');
    const tab2Container = document.getElementById('tab2-container');
    if (id === 'tab1' && checked) {
      tab1Container.removeChild(tab1Container.firstElementChild);
      const h1 = document.createElement('h1');
      h1.textContent = 'This is rendered by previous Reconciling'
      tab1Container.appendChild(h1);
      // render(<App title="Stack Reconciler" />, tab1Container);
    }
    if (id === 'tab2' && checked) {
      tab2Container.removeChild(tab2Container.firstElementChild)
      fiberRender(<App title="Fiber Reconciler" />, tab2Container);
      // const h1 = document.createElement('h1');
      // h1.textContent = 'This is rendered by new Reconciling based on Fiber'; 
      // tab2Container.appendChild(h1)
    }
  }

document.querySelectorAll("input[name='tab-input']").forEach((input) => {
  input.addEventListener('change', onChangeReconciler);
});


// const styles = {
//   ul: {
//     'list-style-type': 'none',
//     padding: 0,
//   },
//   button: {
//     width: '60px',
//     'margin-right': '20px',
//   },
// };

// class StoryList extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { stories };
//   }

//   handleAdd() {
//     const story = { name: 'Random story', url: '/', likes: randomLikes() };
//     let s = [...this.state.stories, story];
//     this.setState({ stories: s });
//   }

//   render() {
//     return (
//       <div id="list">
//         <ul style={styles.ul}>
//           {this.state.stories.map((s, i) => {
//             return <StoryLike story={s} />;
//           })}
//         </ul>
//         <button onClick={e => this.handleAdd()}>Add</button>
//       </div>
//     );
//   }
// }

// class StoryLike extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { likes: props.story.likes };
//   }

//   like() {
//     this.setState({ likes: this.state.likes + 1 });
//   }

//   render() {
//     const { story } = this.props;
//     return (
//       <li>
//         <button style={styles.button} onClick={e => this.like()}>
//           {this.state.likes}
//           ❤️
//         </button>
//         <a href={story.url}>{story.name}</a>
//       </li>
//     );
//   }
// }

// class App extends Component {
//   constructor(props) {
//     super(props);
//   }

//   render() {
//     return (
//       <div>
//         <h1>{this.props.title}</h1>
//         <StoryList />
//       </div>
//     );
//   }
// }

// render(<App title="Full tree mount" />, rootContainer);
