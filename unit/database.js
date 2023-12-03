import pkg from 'pg';
const { Client } = pkg;
const backendData = new Client(
    {
        database: "backendData",
        user: 'postgres',
        password: "ryh2007316",
        port: 5432
    }
)
await backendData.connect();
export default backendData