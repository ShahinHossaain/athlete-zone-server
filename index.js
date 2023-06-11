const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const uri = `mongodb+srv://${process.env.DB_name}:${process.env.DB_pass}@cluster0.98whfas.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        const database = client.db('sportsDB');
        const usersCollection = database.collection('users');
        const classCollection = database.collection('classes');

        await client.db('admin').command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');
        // user start 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const result = await usersCollection.findOne({ email: email });
            // const result = await cursor.toArray();
            console.log(result);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            console.log(result);
            res.send(result);
        });

        // app.put('/users/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const options = { upsert: true };
        //     const updatedUser = req.body;
        //     console.log(req.body);
        //     const updateDoc = {
        //         $set: updatedUser,
        //     };
        //     const result = await usersCollection.updateOne(filter, updateDoc, options);
        //     res.send(result);
        // });

        // app.put('/users/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const options = { upsert: true };
        //     const updatedUser = req.body;
        //     console.log(req.body);
        //     const updateDoc = {
        //         $set: updatedUser,
        //     };
        //     const result = await usersCollection.updateOne(filter, updateDoc, options);
        //     res.send(result);
        // });
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedUser = req.body;
            console.log(req.body);
            const updateDoc = {
                $set: updatedUser,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const role = req.body;
            console.log(role);
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: role.role
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.send(result);
        });

        // user end 

        // class start 



        app.post('/classes', async (req, res) => {
            const newClass = req.body;
            console.log(newClass);
            const result = await classCollection.insertOne(newClass);
            res.send(result);
        })

        app.get('/classes', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { instructorEmail: req.query.email }
            }
            const cursor = classCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // app.patch('/classes/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const data = req.body;
        //     console.log(data);

        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             className: data.className,
        //             classImage: data.classImage,
        //             availableSeats: data.availableSeats,
        //             price: data.price,
        //         }
        //     };
        //     const result = await classCollection.updateOne(filter, updateDoc, options);
        //     console.log(result);
        //     res.send(result);
        // });


        app.patch('/classes/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const data = req.body;
                console.log(data);

                const options = { upsert: true };
                const updateDoc = { $set: {} };

                // Iterate over the keys in the data object and add them to the updateDoc dynamically
                for (const key in data) {
                    updateDoc.$set[key] = data[key];
                }

                const result = await classCollection.updateOne(filter, updateDoc, options);
                console.log(result);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('An error occurred');
            }
        });



    } finally {
        // Uncomment the following line if you want to close the MongoDB client
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Athlete Zone');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
