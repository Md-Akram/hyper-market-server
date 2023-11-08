const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hcdfjvb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db("marketDB");
        const jobsCollection = database.collection("jobs");
        const bidsCollection = database.collection("bids");

        app.post('/jobs', async (req, res) => {
            const job = req.body
            const result = await jobsCollection.insertOne(job)
            res.send(result)
        })

        app.get('/jobs/:category', async (req, res) => {
            const category = req.params.category
            console.log(category);
            const query = { category: `${category}` }
            const cursor = jobsCollection.find(query)
            const askedJobs = await cursor.toArray()
            res.send(askedJobs)
        })

        app.get('/jobs/mypostedjobs/:email', async (req, res) => {
            const email = req.params.email
            console.log(email);
            const query = { sellerEmail: `${email}` }
            const cursor = jobsCollection.find(query)
            const askedJobs = await cursor.toArray()
            res.send(askedJobs)
        })

        app.get('/job/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(`${id}`) }
            const askedJob = await jobsCollection.findOne(query)
            res.send(askedJob)
        })

        app.post('/bids', async (req, res) => {
            const bid = req.body
            const result = await bidsCollection.insertOne(bid)
            res.send(result)
        })

        app.put('/jobs/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const updatedJob = req.body
            const filter = { _id: new ObjectId(`${id}`) }
            const options = { upsert: true }
            const updateJob = {
                $set: {
                    ...updatedJob
                    // name: updatedProduct.name,
                    // brandName: updatedProduct.brandName,
                    // imgURL: updatedProduct.imgURL,
                    // type: updatedProduct.type,
                    // price: updatedProduct.price,
                    // ratings: updatedProduct.ratings
                }
            }
            const result = await jobsCollection.updateOne(filter, updateJob, options)
            res.send(result)
        })

        app.delete('/deletejob/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(`${id}`) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
