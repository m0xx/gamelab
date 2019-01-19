const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 1337 });

const parse = (msg) => {
    try {
        return JSON.parse(msg)
    }
    catch(err) {
        console.error(`Can't parse ${msg}`)
    }
}

const prepareMsg = (message, payload = {}) => {
    return JSON.stringify({message, payload})
}

const gameById = {}
const clientByPlayerId = {}

const processMessage = ({message, payload}, client) => {
    if(message === 'cmd:game:create') {
        const {gameId, playerId} = payload;

        const game = {
            gameId,
            player1Id: playerId,
            player2Id: null
        }

        gameById[gameId] = game;
        clientByPlayerId[playerId] = client;

        client.send(prepareMsg('game:created', game));

        console.log('Create game')
    }
    if(message === 'cmd:player:join') {
        const {gameId, playerId} = payload;

        if(gameById[gameId]) {
            const game = gameById[gameId];

            if(game.player2Id) {
                client.send(prepareMsg('game:full', gameById[gameId]))
            }
            else {
                game.player2Id = playerId;
                clientByPlayerId[playerId] = client;

                client.send(prepareMsg('player:joined', gameById[gameId]));
                clientByPlayerId[game.player1Id].send(prepareMsg('player:joined', gameById[gameId]));

                console.log('Player join')
            }
        }
        else {
            client.send(prepareMsg('game:not-found', {}))
        }
    }
}
wss.broadcast = function broadcast(msg, payload) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(prepareMsg(msg, payload));
        }
    });
};

wss.on('connection', function connection(ws) {
    ws.send(prepareMsg("connect", {x: 212}))
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        processMessage(parse(message), ws)
        // wss.broadcast(message)
    });
});