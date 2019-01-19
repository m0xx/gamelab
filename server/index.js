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


const me = (game, playerId) => (game.p1.id === playerId ? game.p1 : game.p2);
const opponent = (game, playerId) => (game.p1.id !== playerId ? game.p1 : game.p2);

const processMessage = ({message, payload}, client) => {
    if(message === 'cmd:game:create') {
        const {gameId, playerId} = payload;

        const game = {
            gameId,
            p1: {
                id: playerId,
                ready: false
            },
            p2: {
                id: null,
                ready: false
            }
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

            if(game.p2.id) {
                client.send(prepareMsg('game:full', gameById[gameId]))
            }
            else {
                game.p2.id = playerId;
                clientByPlayerId[playerId] = client;

                broadcast(gameId, 'player:joined', game)

                console.log('Player join', game)
            }
        }
        else {
            client.send(prepareMsg('game:not-found', {}))
        }
    }
    if(message === 'cmd:player:ready') {
        const {gameId, playerId} = payload
        const game = gameById[gameId];

        if(game.p1.id === playerId) {
            game.p1.ready = true
        }
        else if(game.p2.id === playerId) {
            game.p2.ready = true
        }

        broadcast(gameId, 'player:ready', game)

        console.log(game)
        if(game.p1.ready && game.p2.ready) {
            broadcast(gameId, 'game:start', game)
        }
    }
    if(message === 'cmd:key:press') {
        const {gameId, playerId, key} = payload
        const game = gameById[gameId];

        clientByPlayerId[opponent(game, playerId).id].send(prepareMsg('player:key:press', {
            gameId,
            playerId,
            key
        }))
    }
    if(message === 'cmd:key:release') {
        const {gameId, playerId, key} = payload
        const game = gameById[gameId];

        clientByPlayerId[opponent(game, playerId).id].send(prepareMsg('player:key:release', {
            gameId,
            playerId,
            key
        }))
    }
}
function broadcast(gameId, msg, payload) {

    const game = gameById[gameId]
    if(game.p1.id) {
        if(clientByPlayerId[game.p1.id]) {
            clientByPlayerId[game.p1.id].send(prepareMsg(msg, payload))
        }
    }
    if(game.p2.id) {
        if(clientByPlayerId[game.p2.id]) {
            clientByPlayerId[game.p2.id].send(prepareMsg(msg, payload))
        }
    }
};

wss.on('connection', function connection(ws) {
    ws.send(prepareMsg("connect", {x: 212}))
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        processMessage(parse(message), ws)
        // wss.broadcast(message)
    });
});