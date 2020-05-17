import * as express from 'express';

const app = express();

app.use(express.static('final'));

app.listen(9000, function() {
    console.log('listening on port 9000');
})
