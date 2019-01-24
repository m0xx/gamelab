import {EventEmitter} from 'eventemitter3';


class Client extends EventEmitter{
    socket?: any;
    connected: boolean;
    url?: string;
    constructor(url) {
        super();
        this.url = url;
    }
    init() {
        return new Promise<void>((resolve, reject) => {
            this.socket = new WebSocket(this.url);
            this.socket.onmessage = (msg) => {
                console.log('Msg:', JSON.parse(msg.data))
                const {message, payload} = JSON.parse(msg.data);
                this.emit(message, payload)
            };

            this.socket.onerror = (err) => {
                if(!this.connected) {
                    reject(err);
                }

                console.error(err)
            }

            this.socket.onopen = () => {
                this.connected = true;
                resolve();
            }
        })
    }
    send(message, payload = {}) {
        if(!this.socket) {
            throw new Error('Client must be initialized')
        }

        this.socket.send(JSON.stringify({
            message,
            payload
        }))
    }
}

export default Client;