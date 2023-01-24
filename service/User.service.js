import { client } from '../server.js';


export async function CreateUser(data) {
    return await client.db('chatapp').collection('users').insertOne(data);
}

export async function getUserByName(email) { //done
    return await client.db('chatapp').collection('users').findOne({email:email});
}

export async function getUserByEmail(email) {
    return await client.db('chatapp').collection('users').findOne({email:email});
}