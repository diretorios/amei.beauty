import { render } from 'preact';
import { App } from './App';
import './styles/index.css';
import './styles/components.css';
import './styles/public-card.css';
import './styles/directory.css';
import './styles/ai-completion.css';

render(<App />, document.getElementById('app')!);

