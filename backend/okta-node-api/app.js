const express = require('express');
const app = express();

app.use(express.json());

const users = [
    { id: 1, name: "Nick Romero", gender: "male" },
    { id: 2, name: "Thea Borre", gender: "female" },
    { id: 3, name: "Nikkiito", gender: "male" },
    { id: 4, name: "Emilia", gender: "female" },
];

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/api/users', (req, res) => {
    res.send(users);
});

app.get('/api/users/:id', (req, res) => {
    const id = req.params.id;
    let user = users.find(c => c.id === parseInt(id));

    if (!user) res.status(404).send('User is not found');

    res.send(user);
});

app.post('/api/users', (req, res) => {
    if (!req.body.name || !req.body.gender) {
        res.status(400).send("Invalid data");
        return;
    }

    const user = {
        id: users.length + 1,
        name: req.body.name,
        gender: req.body.gender
    };
    users.push(user);
    res.send(user);
});

app.put('/api/users/:id', (req, res) => {
    const id = req.params.id;
    let user = users.find(c => c.id === parseInt(id));

    if (!user) {
        res.status(404).send('User is not found');
        return;
    }

    if (!req.body.name || !req.body.gender) {
        res.status(400).send("Invalid data");
        return;
    }

    user.name = req.body.name;
    user.gender = req.body.gender;
    res.send(user);
});

app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    let user = users.find(c => c.id === parseInt(id));

    if (!user) {
        res.status(404).send('User is not found');
        return;
    }

    const index = users.indexOf(user);
    users.splice(index, 1);

    res.send(user);
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening to port ${port}...`));