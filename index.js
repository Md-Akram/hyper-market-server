const express = require('express');
const cors = require('cors')
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
require('dotenv').config()


app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: ['http://localhost:5173', "https://hyper-market-67575.web.app", "https://hyper-market-67575.firebaseapp.com"],
    credentials: true
}))

const verify = (req, res, next) => {
    const token = req.cookies?.token
    console.log("i am from very", req.cookies)
    if (!token) {
        return res.status(401).send({ status: 'Unauthorized Access', code: '401' })
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ status: 'Unauthorized Access', code: '401' })
        }
        console.log(decoded);
        req.user = decoded
        next()
    })

}


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

        app.post('/jwt', async (req, res) => {
            const body = req.body
            console.log(body);
            const token = jwt.sign(body, process.env.SECRET, { expiresIn: '10h' })
            const expirationDate = new Date()
            expirationDate.setDate(expirationDate.getDate() + 7)
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                expires: expirationDate
            })
            console.log(token);
            res.send({ body, token })
        })

        app.get('/jobs/:category', async (req, res) => {
            const category = req.params.category
            const query = { category: `${category}` }
            const cursor = jobsCollection.find(query)
            const askedJobs = await cursor.toArray()
            res.send(askedJobs)
        })

        app.get('/jobs/mypostedjobs/:email', verify, async (req, res) => {
            const email = req.params.email
            const query = { sellerEmail: `${email}` }
            const cursor = jobsCollection.find(query)
            const askedJobs = await cursor.toArray()
            res.send(askedJobs)
        })

        app.get('/bids/mybids/:email', verify, async (req, res) => {
            const email = req.params.email
            const query = {
                bidderEmail: `${email}`
            }
            const cursor = bidsCollection.find(query)
            const data = await cursor.sort({ status: 1 }).toArray()
            res.send(data)
        })

        app.get('/bids/bidrequests/:email', verify, async (req, res) => {
            const email = req.params.email
            const query = {
                sellerEmail: `${email}`
            }
            const cursor = bidsCollection.find(query)
            const data = await cursor.toArray()
            res.send(data)
        })

        app.get('/job/:id', verify, async (req, res) => {
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
            const updatedJob = req.body
            const filter = { _id: new ObjectId(`${id}`) }
            const options = { upsert: true }
            const updateJob = {
                $set: {
                    ...updatedJob
                }
            }
            const result = await jobsCollection.updateOne(filter, updateJob, options)
            res.send(result)
        })

        app.put('/bids/:id', async (req, res) => {
            const id = req.params.id
            const updatedBid = req.body
            const filter = { _id: new ObjectId(`${id}`) }
            const options = { upsert: true }
            const updateBid = {
                $set: {
                    ...updatedBid
                }
            }
            const result = await bidsCollection.updateOne(filter, updateBid, options)
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
