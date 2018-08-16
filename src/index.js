/** @jsx createElement */
import { createElement, Component, render } from './core/didact';

const randomLikes = () => Math.ceil(Math.random() * 100);
const rootContainer = document.body;
const stories = [
  {
    name: 'Didact introduction',
    url: 'http://bit.ly/2pX7HNn',
    likes: randomLikes(),
  },
  {
    name: 'Rendering DOM elements ',
    url: 'http://bit.ly/2qCOejH',
    likes: randomLikes(),
  },
  {
    name: 'Element creation and JSX',
    url: 'http://bit.ly/2qGbw8S',
    likes: randomLikes(),
  },
  {
    name: 'Instances and reconciliation',
    url: 'http://bit.ly/2q4A746',
    likes: randomLikes(),
  },
  {
    name: 'Components and state',
    url: 'http://bit.ly/2rE16nh',
    likes: randomLikes(),
  },
];

const styles = {
  ul: {
    'list-style-type': 'none',
    padding: 0,
  },
  button: {
    width: '60px',
    'margin-right': '20px',
  },
};

class StoryList extends Component {
  constructor(props) {
    super(props);
    this.state = { stories };
  }
  //
  // like(story) {
  //   const s = {likes: story.likes+1, ...story}
  //   story.likes += 1;
  // }

  handleAdd() {
    const story = { name: 'Random story', url: '/', likes: randomLikes() };
    let s = [...this.state.stories, story];
    this.setState({ stories: s });
    render(<App title="Full tree update with new node" />, rootContainer);
  }

  render() {
    return (
      <div id="list">
        <ul style={styles.ul}>
          {this.state.stories.map((s, i) => {
            return <StoryLike story={s} />;
          })}
        </ul>
        <button onClick={e => this.handleAdd()}>Add</button>
      </div>
    );
  }
}

class StoryLike extends Component {
  constructor(props) {
    super(props);
    this.state = { likes: randomLikes() };
  }

  like() {
    this.setState({ likes: this.state.likes + 1 });
    render(<App title="Full tree update" />, rootContainer);
  }

  render() {
    const { story } = this.props;
    return (
      <li>
        <button style={styles.button} onClick={e => this.like()}>
          {this.state.likes} <b> ❤️</b>
        </button>
        <a href={story.url}>{story.name}</a>
      </li>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h1>{this.props.title}</h1>
        <StoryList />
      </div>
    );
  }
}

render(<App title="Full tree mount" />, rootContainer);
