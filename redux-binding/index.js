const {createStore, combineReducers} = require('redux');
const initSubscriber = require('redux-subscriber');

const initialPlayerState = {
    x: 0,
    y: 0,
    state: 'idle',
}

const initialGameState = {
    p1: {...initialPlayerState},
    p2: {...initialPlayerState}
}


const playerInit = (id, x, y) => {
    return {
        type: 'PLAYER_INIT',
        payload: {
            id,
            x,
            y
        }
    }
}


const playerMove = (id, x, y) => {
    return {
        type: 'PLAYER_MOVE',
        payload: {
            id,
            x,
            y
        }
    }
}

const playerIdle = (id) => {
    return {
        type: 'PLAYER_IDLE',
        payload: {id}
    }
}

const playerRun = (id) => {
    return {
        type: 'PLAYER_RUN',
        payload: {id}
    }
}


const selectPlayerState = (id, state) => (state.gameState[id] || null);


const reducer = (state = {}, action) => {
    console.log(action)
    const {type, payload} = action;
    switch(type) {
        case 'PLAYER_INIT': {
            const {id, x, y} = payload;
            return {
                ...state,
                [id]: {
                    ...initialPlayerState,
                    x,
                    y,
                }
            }
        }
        case 'PLAYER_MOVE': {
            const {id, x, y} = payload;
            return {
                ...state,
                [id]: {
                    ...state[id],
                    x,
                    y
                }
            }
        }
        case 'PLAYER_IDLE': {
            const {id} = payload;
            return {
                ...state,
                [id]: {
                    ...state[id],
                    state: 'idle',
                }
            }
        }
        case 'PLAYER_RUN': {
            const {id} = payload;
            return {
                ...state,
                [id]: {
                    ...state[id],
                    state: 'run',
                }
            }
        }
    }

    return state;
}


const store = createStore(combineReducers({gameState: reducer}), {});

const subscribe = initSubscriber.default(store);


function dispatchWithTimer(action, subPath) {
    const timer = new Date();

    subscribe(subPath, () => {
        console.log('Elapsed: ', new Date().getTime() - timer.getTime());
    })

    store.dispatch(action);
}
subscribe('gameState.p1', (state) => {
    console.log(state);
    console.log('[P1]:', selectPlayerState('p1', state));
})

subscribe('gameState.p2', (state, n) => {
    console.log('[P2]:', selectPlayerState('p2', state));
})


const MAX_LISTENER = 1;
for(let i=0;i < MAX_LISTENER; i++) {
    subscribe('gameState', () => {

    })
}

dispatchWithTimer(playerInit('p1', 150, 150), 'gameState.p1');
dispatchWithTimer(playerInit('p2', 150, 150), 'gameState.p2');
dispatchWithTimer(playerRun('p1', 'gameState.p1'));
dispatchWithTimer(playerMove('p2', 200, 100), 'gameState.p2');
