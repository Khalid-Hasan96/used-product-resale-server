const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.c12imjm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
            return res.status(403).send('unauthorized access')
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
            if (err) {
                  return res.status(403).send({ message: 'Forbidden access' })
            }
            req.decoded = decoded;
            next();
      })
}


async function run() {
      try {
            const categoriesCollection = client.db("pcbuydb").collection("porductCategories");
            const productCollection = client.db("pcbuydb").collection("products");
            const usersCollection = client.db("pcbuydb").collection("users");

            app.get('/jwt', async (req, res) => {
                  const email = req.query.email;
                  const query = { email: email };
                  const user = await usersCollection.findOne(query);
                  if (user) {
                        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
                        return res.send({ accessToken: token })
                  }
                  res.status(403).send({ accessToken: '' })
            })

            app.get('/categories', async (req, res) => {
                  const query = {};
                  const cursor = categoriesCollection.find(query);
                  const categories = await cursor.toArray();
                  res.send(categories)
            });
            // products
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

            // users
            app.get('/users', async (req, res) => {
                  const query = {};
                  const users = await usersCollection.find(query).toArray();
                  res.send(users)
            });

            app.post('/users', async (req, res) => {
                  const query = req.body;
                  const result = await usersCollection.insertOne(query);
                  res.send(result);
            });

            //make admin
            app.put('/users/admin/:id', verifyJWT, async (req, res) => {
                  const id = req.params.id;
                  const filter = { _id: ObjectId(id) };
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: {
                              role: 'Admin'
                        }
                  }
                  const result = await usersCollection.updateOne(filter, updateDoc, options);
                  res.send(result)
            });
            app.delete('/users/:id', verifyJWT, async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: ObjectId(id) };
                  const result = await usersCollection.deleteOne(query);
                  res.send(result)
            })

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