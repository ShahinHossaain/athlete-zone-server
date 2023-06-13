const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
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
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // maxPoolSize: 10
});

const userVerify = (req, res, next) => {
    // console.log('called');
    // console.log('headers', req.headers.authorization);

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send('bolod naki, token koi tor')
    const token = auth.split(' ')[1];
    // console.log('tata', token);

    jwt.verify(token, process.env.SECRET_key, (err, decoded) => {
        if (err) {
            console.log('kire bolda');
            return res.status(401).send({ error: true, message: "Unauthorized access" });
        }
        req.decoded = decoded;
        next()
    });
}
async function run() {
    try {

        const database = client.db('sportsDB');
        const usersCollection = database.collection('users');
        const classCollection = database.collection('classes');

        // TODO: insert token to env variable  
        app.post('/jwt', async (req, res) => {
            const email = req.body;
            // console.log(email, process.env.SECRET_key);
            const token = jwt.sign(email, process.env.SECRET_key, { expiresIn: '7d' })
            // console.log('tkn', token);
            res.send(token);
        })

        // user start 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const result = await usersCollection.findOne({ email: email });
            // const result = await cursor.toArray();
            // console.log(result);
            res.send(result);
        });


        // app.patch('/users/selectedClasses/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const id = req.body.selectedClass;
        //     console.log('id', id);
        //     try {
        //         const result = await usersCollection.findOneAndUpdate(
        //             { email: email },
        //             { $addToSet: { selectedClasses: id } },
        //             { upsert: true }
        //         );

        //         if (result.value) {
        //             res.send({ message: 'Selected class added successfully' });
        //         } else {
        //             res.status(404).send({ error: 'User not found' });
        //         }
        //     } catch (error) {
        //         console.error('Error updating selected classes:', error);
        //         res.status(500).send({ error: 'Internal server error' });
        //     }
        // });

        app.patch('/users/selectedClasses/:email', async (req, res) => {
            const email = req.params.email;
            const id = req.body.selectedClass;
            console.log('id', id);
            try {
                const result = await usersCollection.findOneAndUpdate(
                    { email: email },
                    { $push: { selectedClasses: { [id]: 0 } } },
                    { upsert: true }
                );

                if (result.value) {
                    res.send({ message: 'Selected class added successfully' });
                } else {
                    res.status(404).send({ error: 'User not found' });
                }
            } catch (error) {
                console.error('Error updating selected classes:', error);
                res.status(500).send({ error: 'Internal server error' });
            }
        });






        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            // console.log(result);
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
            // console.log(req.body);
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
            // console.log(role);
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: role.role
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            // console.log(result);
            res.send(result);
        });

        // Assuming you have created an Express app and it's assigned to the variable 'app'

        // app.patch('/classEnroll/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const email = req.query.email;

        //     console.log(id, email);
        //     const user = await usersCollection.findOne({ email: email });
        //     console.log(user);
        //     // Your code to handle the enrollment logic goes here

        //     // Send a response indicating the enrollment is successful
        //     res.status(200).json({ message: 'Enrollment successful' });
        // });

        app.patch('/classEnroll/:id', async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;

            try {
                // Find the user document based on the email
                const user = await usersCollection.findOne({ email: email });

                // Update the selectedClasses array element with the specified ID
                user.selectedClasses.forEach(classObj => {
                    const classId = Object.keys(classObj)[0];
                    if (classId === id) {
                        classObj[classId] = 1;
                    }
                });

                // Save the updated user document
                await usersCollection.updateOne({ email: email }, { $set: { selectedClasses: user.selectedClasses } });

                // const classItem = await classCollection.findOne({ id: new ObjectId(id) });
                // console.log(cla);

                const result = await classCollection.findOne({ _id: new ObjectId(id) }, { projection: { enrolled: 1, _id: 0 } });
                console.log('NNNNNNNNNNNNNNNNNN', result.enrolled);

                const updateDoc = {
                    $set: {
                        enrolled: ++result.enrolled
                    }
                }
                const updateEnroll = await classCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
                // Send a response indicating the enrollment is successful
                res.status(200).json({ message: 'Enrollment successful' });
            } catch (error) {
                console.error(error);
                // Send an error response
                res.status(500).json({ message: 'Enrollment failed' });
            }
        });







        // user end 

        // class start 


        app.post('/classes', async (req, res) => {
            const newClass = req.body;
            // console.log(newClass);
            const result = await classCollection.insertOne(newClass);
            res.send(result);
        })


        app.get('/classes/:id', async (req, res) => {
            const isEnabled = req.query.isEnabled;
            const email = req.query.email;

            console.log('vvvvvvvv', isEnabled, email);
            const id = req.params.id;


            const user = await usersCollection.findOne({ email: email });

            const matchingClass = user.selectedClasses.find((selectedClass) => {

                const classId = Object.keys(selectedClass)[0];
                const value = Object.values(selectedClass)[0];
                console.log(classId, value);
                console.log(typeof value, typeof isEnabled);
                if (classId === id && value === parseInt(isEnabled)) {

                    return classId
                }
                return
                // console.log('selectedClass', selectedClass);
            });
            if (!matchingClass) {
                // Send empty response if no match is found
                res.send()
            }
            else {

                const id = Object.keys(matchingClass);
                console.log("idddd", id[0]);
                const filter = { _id: new ObjectId(id[0]) };
                const result = await classCollection.findOne(filter);
                res.send(result);
            }
        });
        // app.get('/classes/:id', async (req, res) => {
        //     const isEnabled = req.query.isEnabled;
        //     const email = req.query.email;

        //     console.log('vvvvvvvv', isEnabled, email);
        //     const id = req.params.id;

        //     const user = await usersCollection.findOne({ email: email });
        //     console.log(user.selectedClasses, 'id', id, 'c', ++c);

        //     const matchingClass = user.selectedClasses.find((selectedClass) => {
        //         const [classId, value] = Object.entries(selectedClass)[0];
        //         console.log(classId, value);
        //         if (classId === id && value === 0) {
        //             console.log('kattu', classId, 'id', id, value);
        //             return selectedClass; // Return the entire selectedClass object
        //         }
        //     });


        //     if (matchingClass) {
        //         const id = Object.keys(matchingClass);
        //         console.log("idddd", id[0]);
        //         const filter = { _id: new ObjectId(id[0]) };
        //         const result = await classCollection.findOne(filter);
        //         res.send(result);
        //     }
        // });





        app.get('/classes', async (req, res) => {

            if (req.query?.fromManageClasses) {
                const cursor = classCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                let query = { status: 'approve' };
                if (req.query?.email) {
                    query = { instructorEmail: req.query.email, status: 'approve' }
                }

                const count = await classCollection.countDocuments();

                let options = { limit: count }
                if (req.query?.limit) {
                    options = { limit: parseInt(req.query.limit) }
                }


                const cursor = classCollection.find(query, options);
                const result = await cursor.toArray();
                res.send(result);
            }

        })



        app.get('/feedback/:id', userVerify, async (req, res) => {
            const decodedEmail = req.decoded?.email;
            console.log('decodedEmail', decodedEmail, req.query.email);
            if (req?.query?.email) {
                if (decodedEmail !== req.query?.email) return res.status(403).send({ error: true, message: "Forbidden access" });
            }
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await classCollection.findOne(filter, { projection: { feedback: 1 } })
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
                console.log('dataaa', data);
                let updateDoc;
                if (data.status === 'approve') {
                    updateDoc = {
                        $set: {
                            enrolled: 0,
                            status: data.status,
                        }
                    };
                }
                else if (!data.status) {
                    updateDoc = { $set: data };
                }
                else {
                    updateDoc = {
                        $set: {
                            status: data.status,
                        }
                    };
                }
                const options = { upsert: true };
                // const updateDoc = { $set: {} };

                // Iterate over the keys in the data object and add them to the updateDoc dynamically
                // for (const key in data) {
                //     updateDoc.$set[key] = data[key];
                // }

                const result = await classCollection.updateOne(filter, updateDoc, options);
                console.log(result);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('An error occurred');
            }
        });

        // app.delete("/classDelete/:id", async (req, res) => {
        //     const { id } = req.params;
        //     console.log('iddd', id);
        //     const email = req?.query?.email; // Assuming you have implemented user authentication
        //     console.log(req.query);
        //     try {
        //         // Find the user by email
        //         const user = await usersCollection.findOne({ email });
        //         console.log(user);

        //         if (!user) {
        //             return res.status(404).json({ message: "User not found" });
        //         }

        //         // Remove the class ID from the selectedClasses array
        //         user.selectedClasses = user.selectedClasses.filter(
        //             (classId) => classId !== id
        //         );

        //         // Save the updated user document
        //         await usersCollection.updateOne({ email }, { $set: user });

        //         res.status(200).json({ message: "Class removed successfully" });
        //     } catch (error) {
        //         console.log("Error removing class:", error);
        //         res.status(500).json({ message: "Server error" });
        //     }
        // });

        app.delete("/classDelete/:id", async (req, res) => {
            const { id } = req.params;
            const email = req.query.email;

            try {
                // Find the user by email
                const user = await usersCollection.findOne({ email });

                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Remove the class ID from the selectedClasses array
                user.selectedClasses = user.selectedClasses.filter((classObj) => {
                    return Object.keys(classObj)[0] !== id;
                });

                // Save the updated user document
                await usersCollection.updateOne({ email }, { $set: user });

                res.status(200).json({ message: "Class removed successfully" });
            } catch (error) {
                console.log("Error removing class:", error);
                res.status(500).json({ message: "Server error" });
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
    console.log(`Example app listening on port ${por}`);
});
