import { render } from 'preact';
import { App } from './App';
import './styles/index.css';
import './styles/components.css';
import './styles/public-card.css';
import './styles/directory.css';
import './styles/update-status.css';

render(<App />, document.getElementById('app')!);

