import createApp from './app';

let app = createApp();

// The application will create a canvas element for you that you
// can then insert into the DOM
document.getElementById("app").appendChild(app.view);