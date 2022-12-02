const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

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
            const bookingCollection = client.db("pcbuydb").collection("booking");

            const verifyAdmin = async (req, res, next) => {
                  console.log(req.decoded.email);
                  const decodedEmail = req.decoded.email;
                  const query = { email: decodedEmail };
                  const user = await usersCollection.findOne(query);
                  if (user?.role !== 'Admin') {
                        return res.status(403).send({ message: 'forbidden access' })
                  }
                  next()
            }

            const verifySeller = async (req, res, next) => {
                  const decodedEmail = req.decoded.email;
                  const query = { email: decodedEmail };
                  const user = await usersCollection.findOne(query);
                  if (user?.role !== 'Seller') {
                        return res.status(403).send({ message: 'forbidden access' })
                  }
                  next()
            }

            app.get('/jwt', async (req, res) => {
                  const email = req.query.email;
                  const query = { email: email };
                  const user = await usersCollection.findOne(query);
                  if (user) {
                        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
                        return res.send({ accessToken: token })
                  }
                  res.status(403).send({ accessToken: '' })
            });

            app.post('/bookings', async (req, res) => {
                  const booking = req.body;
                  const query = {
                        product: booking.product,
                        price: booking.price,
                        name: booking.name,
                        email: booking.name,
                        phone: booking.phone,
                        location: booking.location
                  }

                  const result = await bookingCollection.insertOne(booking);
                  res.send(result)
            });
            app.get('/bookings', async (req, res) => {
                  let query = {};
                  if (req.query.email) {
                        query = {
                              email: req.query.email
                        }
                  }
                  const cursor = bookingCollection.find(query);
                  const products = await cursor.toArray();
                  res.send(products)
            });
            app.delete('/bookings/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: ObjectId(id) };
                  const booking = await bookingCollection.deleteOne(query);
                  res.send(booking)
            });

            app.get('/categories', async (req, res) => {
                  const query = {};
                  const cursor = categoriesCollection.find(query);
                  const categories = await cursor.toArray();
                  res.send(categories)
            });

            app.get('/category', async (req, res) => {
                  const query = {};
                  const result = await categoriesCollection.find(query).project({ title: 1 }).toArray();
                  res.send(result)
            })
            // products
            app.get('/products', async (req, res) => {
                  const query = {};
                  const product = await productCollection.find(query).sort({ _id: -1 }).toArray();
                  res.send(product);
            });
            app.get('/myproducts', async (req, res) => {
                  let query = {};
                  if (req.query.email) {
                        query = {
                              email: req.query.email
                        }
                  }
                  const cursor = productCollection.find(query);
                  const products = await cursor.toArray();
                  res.send(products)
            });

            app.post('/products', async (req, res) => {
                  const product = req.body;
                  const result = await productCollection.insertOne(product);
                  res.send(result);
            });

            app.delete('/products/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: ObjectId(id) };
                  const product = await productCollection.deleteOne(query);
                  res.send(product)
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

            app.get('/users/buyers', async (req, res) => {
                  const query = { role: 'Buyer' };
                  const buyers = await usersCollection.find(query).toArray();
                  res.send(buyers)
            });

            app.delete('/users/buyers/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: ObjectId(id) };
                  const buyers = await usersCollection.deleteOne(query);
                  res.send(buyers)
            });

            app.get('/users/sellers', async (req, res) => {
                  const query = { role: 'Seller' };
                  const sellers = await usersCollection.find(query).toArray();
                  res.send(sellers)
            });

            app.delete('/users/sellers/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: ObjectId(id) };
                  const seller = await usersCollection.deleteOne(query);
                  res.send(seller)
            });

            app.patch('/users/sellers/:id', async (req, res) => {
                  const id = req.params.id;
                  const filter = { _id: ObjectId(id) };
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: {
                              verifiedSeller: 'Verify'
                        }
                  };
                  const result = await usersCollection.updateOne(filter, updateDoc, options);
                  res.send(result)
            });

            app.post('/users', async (req, res) => {
                  const query = req.body;
                  const result = await usersCollection.insertOne(query);
                  res.send(result);
            });

            app.get('/users/admin/:email', async (req, res) => {
                  const email = req.params.email;
                  const query = { email };
                  const user = await usersCollection.findOne(query);
                  res.send({ isAdmin: user?.role === 'Admin' });
            });

            app.get('/users/seller/:email', async (req, res) => {
                  const email = req.params.email;
                  const query = { email };
                  const user = await usersCollection.findOne(query);
                  res.send({ isSeller: user?.role === 'Seller' });
            });

            //make admin
            app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
                  const id = req.params.id;
                  const filter = { _id: ObjectId(id) };
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: {
                              role: 'Admin'
                        }
                  };
                  const result = await usersCollection.updateOne(filter, updateDoc, options);
                  res.send(result)
            });

            app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
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