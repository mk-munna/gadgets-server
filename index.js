const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yfvcqxe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const gadgetsCollection = client.db('GadgetsDB').collection('Gadgets');

        // Load data with pagination, searching, categorization, and sorting
        app.get('/gadgets', async (req, res) => {
            const { page = 1, limit = 10, search = '', category = '', brand = '', priceMin, priceMax, sort } = req.query;

            const query = {
                ...(search && { name: { $regex: search, $options: 'i' } }),
                ...(category && { category }),
                ...(brand && { brand }),
                ...(priceMin && priceMax && { price: { $gte: parseInt(priceMin), $lte: parseInt(priceMax) } })
            };

            const options = {
                sort: {
                    ...(sort === 'priceLowHigh' && { price: 1 }),
                    ...(sort === 'priceHighLow' && { price: -1 }),
                    ...(sort === 'dateNew' && { date: -1 })
                },
                skip: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit)
            };

            const gadgets = await gadgetsCollection.find(query, options).toArray();
            const totalCount = await gadgetsCollection.countDocuments(query);
            const totalPages = Math.ceil(totalCount / parseInt(limit));

            res.send({
                gadgets,
                totalPages,
                currentPage: parseInt(page),
            });
        });

        console.log("Connected to MongoDB and ready to serve requests!");
    } finally {
        // The client connection is kept open to serve requests.
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
