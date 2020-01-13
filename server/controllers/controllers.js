const argon2 = require('argon2');
const secret = require('../../secret.js');
const jwt = require('jsonwebtoken');

module.exports = {
    create: (req, res) => {
        const db = req.app.get('db');
        const { username, email, password } = req.body;

        argon2
            .hash(password)
            .then(hash=>{
                return db.users.insert({
                    username,
                    email,
                    password: hash,
                },{
                    fields: ['id', 'username', 'email', 'password']
                });
            })
            .then(user=>{
                const token = jwt.sign({ userId: user.id }, secret)
                res.status(200).json({ ...user, token})
            })
            .catch(err =>{
                console.error(err)
                res.status(500).end()
            })
    },
    login:(req, res) => {
        const db = req.app.get('db');
        const { username, password } = req.body;

        db.users
            .findOne({
                username
            },{
                fields: ['id', 'username', 'password'],
            })
            .then(user => {
                if(!user){
                    throw new Error('Invalid or No Existing Username')
                }
                return argon2.verify(user.password, password)
                .then(valid=>{
                    if(!valid){
                        throw new Error('Invalid Password')
                    }

                    const token = jwt.sign({ userId: user.id }, secret)
                    // delete user.password;
                    res.status(200).json({ ...user, token })
                })
            })
            .catch(err =>{
                if(['Invalid username', 'Incorrect password'].includes(err.message)){
                    res.status(400).json({ error: err.message})
                }else{
                    console.log(err)
                    res.status(500).end()
                }
            })
    },
    getUsers: (req, res) => {
        const db = req.app.get('db')

        db.users
        .find()
        .then(users => res.status(200).json(users))
        .catch(err => {
            console.error(err);
            res.status(500).end();
        });
    },
    getUser: (req, res) => {
        const db = req.app.get('db')

        db.users
        .findOne(req.params.id)
        .then(user => res.status(201).json(user))
        .catch(err =>{
            console.err(err)
            res.status(500).end()
        })
    }
}