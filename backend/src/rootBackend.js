import axios from 'axios';

const SOCKET_PATH = '/app/shared/root-backend.sock';

export const rootBackend = axios.create({
    socketPath: SOCKET_PATH,
    baseURL: 'http://localhost',
});

