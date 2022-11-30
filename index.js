const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.c12imjm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
      try {
            const categoriesCollection = client.db("pcbuydb").collection("porductCategories");
            const productCollection = client.db("pcbuydb").collection("products");

            app.get('/categories', async (req, res) => {
                  const query = {};
                  const cursor = categoriesCollection.find(query);
                  const categories = await cursor.toArray();
                  res.send(categories)
            });
            app.get('/products', async (req, res) => {
                  const query = {};
                  const product = await productCollection.find(query).toArray();
                  res.send(product);
            });
            app.get('/products/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { categoryId: id };
                  const product = await productCollection.find(query).toArray();
                  res.send(product);
            });

      }
      finally {

      }
}
run().catch(error => console.error(error))


app.get('/', (req, res) => {
      res.send('Server running')
});

app.listen(port, () => {
      console.log(`server running on port ${port}`)
})