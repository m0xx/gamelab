// import createApp from './app';
import Game from './game';

// let app = createApp();
// document.getElementById("app").appendChild(app.view);

new Game(window.__WEBSOCKET_URL)
// The application will create a canvas element for you that you
// can then insert into the DOM
