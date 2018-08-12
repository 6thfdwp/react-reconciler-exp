const styles = {
  ul: {
    'list-style-type': 'none',
    padding: 0,
  },
  button: {
    width: '80px',
  },
};
const StoryList = () => (
  <div id="list">
    <ul style={styles.ul}>
      {stories.map((s, i) => {
        const row = StoryLike(s);
        // console.log(row);
        return row;
      })}
    </ul>
    {AddButton()}
  </div>
);

const StoryLike = story => (
  <li name="story">
    <button style={styles.button} onClick={e => handleClick(story)}>
      {story.likes} <b> ❤️</b>
    </button>
    <a href={story.url}>{story.name}</a>
  </li>
);

function AddButton() {
  const story = { name: 'Random story', url: '/', likes: randomLikes() };
  return <button onClick={e => handleAdd(story)}>Add</button>;
}

function handleClick(story) {
  story.likes += 1;
  render(StoryList(), document.body);
}
function handleAdd(story) {
  stories.push(story);
  render(StoryList(), document.body);
}
