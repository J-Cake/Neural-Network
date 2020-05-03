import {app, BrowserWindow} from 'electron';

app.whenReady().then(function() {
    const window = new BrowserWindow({
        minWidth: 720,
        minHeight: 360,
        width: 720,
        height: 360,
        webPreferences: {
            nodeIntegration: true,

        }
    });

    window.loadFile("../final/index.html");
});
