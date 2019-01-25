import {createStore, combineReducers, applyMiddleware} from 'redux';
import  * as initSubscriber from 'redux-subscriber';

import createSagaMiddleware from 'redux-saga'
import { takeEvery, take, put } from 'redux-saga/effects'
import {delay} from "q";

const initialPlayerState = {
    x: 0,
    y: 0,
    visible: false,
    direction: 'right',
    animationName: 'IDLE',
    animationSpeed: 0.2,
    loop: true,
    dead: false,
    remainingLifes: 3
}

export const playerInit = (id, x, y) => {
    return {
        type: 'PLAYER_INIT',
        payload: {
            id,
            x,
            y
        }
    }
}


export const playerMove = (id, x, y) => {
    return {
        type: 'PLAYER_MOVE',
        payload: {
            id,
            x,
            y
        }
    }
}

export const playerIdle = (id) => {
    return {
        type: 'PLAYER_IDLE',
        payload: {id}
    }
}

export const playerRun = (id, direction) => {
    return {
        type: 'PLAYER_RUN',
        payload: {id, direction}
    }
}

export const playerAttack = (id) => {
    return {
        type: 'PLAYER_ATTACK',
        payload: {id}
    }
}

export const playerDie = (id) => {
    return {
        type: 'PLAYER_DIE',
        payload: {id}
    }
}

export const playerRemoveLife = (id) => {
    return {
        type: 'PLAYER_REMOVE_LIFE',
        payload: {id}
    }
}

export const playerHide = (id) => {
    return {
        type: 'PLAYER_HIDE',
        payload: {id}
    }
}

const selectPlayerState = (id, state) => (state.gameState[id] || null);


export const selectors = {
    isRunning: (state, id) => (state.gameState[id].animationName === "RUN"),
    isDirection: (state, id, direction) => (state.gameState[id].direction === direction),
    maxPositionRight: (state, side) => {
        if(side === 'left') {
            return state.gameState.right.x;
        }
        else {
            return 1200 - 288;
        }
    },
    maxPositionLeft: (state, side) => {
        if(side === 'right') {
            return state.gameState.left.x + 288;
        }
        else {
            return 0;
        }
    }
}

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
                    remainingLifes: state[id] ? state[id].remainingLifes : initialPlayerState.remainingLifes,
                    visible: true,
                    dead: false,
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
                    animationName: 'IDLE',
                    animationSpeed: 0.2,
                }
            }
        }
        case 'PLAYER_RUN': {
            const {id, direction} = payload;

            return {
                ...state,
                [id]: {
                    ...state[id],
                    direction,
                    animationName: 'RUN',
                    animationSpeed: 0.4,
                }
            }
        }
        case 'PLAYER_ATTACK': {
            const {id} = payload;

            return {
                ...state,
                [id]: {
                    ...state[id],
                    animationName: 'ATTACK',
                    animationSpeed: 0.15,
                }
            }
        }
        case 'PLAYER_DIE': {
            const {id} = payload;

            return {
                ...state,
                [id]: {
                    ...state[id],
                    animationName: 'DIE',
                    animationSpeed: 0.2,
                    loop: false,
                    dead: true
                }
            }
        }
        case 'PLAYER_REMOVE_LIFE': {
            const {id} = payload;

            return {
                ...state,
                [id]: {
                    ...state[id],
                    remainingLifes: Math.max(0, state[id].remainingLifes - 1)
                }
            }
        }
        case 'PLAYER_HIDE': {
            const {id} = payload;

            return {
                ...state,
                [id]: {
                    ...state[id],
                    visible: false
                }
            }
        }
    }

    return state;
}


const sagaMiddleware = createSagaMiddleware()

const store = window.__store = createStore(combineReducers({gameState: reducer}), {}, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(watchFightFinishRunSaga)

const subscribe = initSubscriber.default(store);



function* watchFightFinishRunSaga() {
    while(true) {
        yield take('PLAYER_REMOVE_LIFE')


        let playerLeftState = getState().gameState.left;
        let playerRightState = getState().gameState.right;

        if(playerLeftState.remainingLifes === 0 || playerRightState.remainingLifes === 0) {
            alert('Finish');
        }
        else {
            yield delay(1500);

            yield put(playerHide('left'));
            yield put(playerHide('right'));
            yield put(playerIdle('left'));
            yield put(playerIdle('right'));
            yield put(playerInit('left', 0, 350));
            yield put(playerInit('right', 1200 - 288, 350));
        }
    }

}


export const dispatch = store.dispatch;
export const subscribeTo = (path, handler) => {
    return subscribe(path, handler);
}
export const getState = store.getState;
