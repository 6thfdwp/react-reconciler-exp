/** @jsx createElement */
import { createElement, Component } from './core/didact';

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
const randomLikes = () => Math.ceil(Math.random() * 100);
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
class StoryLike extends Component {
  render() {
    const { story, onToggle } = this.props;
    return (
      <li id="story-item">
        <button
          id="story-like-btn"
          style={styles.button}
          onClick={(e) => onToggle()}
        >
          {story.likes} ❤️
        </button>
        <a id="story-link" href={story.url}>
          {story.name}
        </a>
      </li>
    );
  }
}

class StoryList extends Component {
  constructor(props) {
    super(props);
    this.state = { stories: stories.slice(0, 1) };
    this.state = { stories };
  }

  handleAdd() {
    const story = { name: 'Random story', url: '/', likes: randomLikes() };
    let s = [...this.state.stories, story];
    this.setState({ stories: s });
  }

  handleLike(i) {
    const stories = this.state.stories;
    const updatedStory = { ...stories[i], likes: stories[i].likes + 1 };
    const nextStories = [
      ...stories.slice(0, i),
      updatedStory,
      ...stories.slice(i + 1),
    ];
    this.setState({ stories: nextStories });
  }

  render() {
    return (
      <div id="list">
        <ul style={styles.ul}>
          {this.state.stories.map((s, i) => {
            return <StoryLike story={s} onToggle={() => this.handleLike(i)} />;
          })}
        </ul>
        <button onClick={(e) => this.handleAdd()}>Add</button>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div id="app-wrapper">
        <h1 id="app-title">{this.props.title}</h1>
        <StoryList />
      </div>
    );
  }
}

export default App;
