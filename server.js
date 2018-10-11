const restify = require('restify');
const MongoClient = require('mongodb').MongoClient;
const jsSHA = require('jssha');
const Passport = require('passport');
const PassportHTTPBearer = require('passport-http-bearer');
const uuidv3 = require('uuid/v3');
const errs = require('restify-errors');
const restify_cors = require('restify-cors-middleware')

const UUID_NAMESPACE = "353ac1c0-cab3-11e8-9211-4f01514d4e40";

(async () => {
  const db = (await MongoClient.connect('mongodb://localhost:27017',
    { useNewUrlParser: true })).db('bos');

  // Simple HMAC based bearer token strategy, not explicitly secure.
  Passport.use(new PassportHTTPBearer.Strategy(async (token, next) => {
    const [hash, username] = token.split('%');

    const user = await db.collection('users').findOne({ username: username });
    if (!user) return next(false);

    const hmac = new jsSHA('SHA-256', 'TEXT');
    hmac.setHMACKey(user['password'], 'TEXT');
    hmac.update(user['username']);
    hmac.update(Date.now().toString(36).substring(0, 4));

    if (hash === hmac.getHMAC('HEX')) return next(null, username);
    return next(false);
  }));

  const cors = restify_cors({
    origins: ['*'],
    allowHeaders: ['Authorization']
  })

  const server = restify.createServer();
  server.pre(restify.pre.sanitizePath());
  server.use(restify.plugins.bodyParser());
  server.pre(cors.preflight)
  server.use(cors.actual)

  server.post('/user', // Create New User
    async (req, res, next) => {
      if (!(req.body.username && req.body.password)) return next(
        new errs.MissingParameterError("Must supply username and password."));

      const id = uuidv3(req.body.username, UUID_NAMESPACE);
      const user = {
        _id: id,
        username: req.body.username,
        password: req.body.password
      };

      const collection = db.collection('users');
      try {
        const new_user = await collection.insertOne(user);
        res.send(new_user);
        next();
      }
      catch(e) {
        return next(new errs.PreconditionFailedError("Could not create user."));
      }

  });

  server.post('/apply', // Apply for New Account
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      res.send();
      next();
  });

  server.get('/clients', // Get Clients for Current User
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      const collection = db.collection('clients');
      const clients = await collection.find({ usernames: req.user }).toArray();
      res.send(clients);
      next();
  });

  server.get('/accounts/:client', // Get Clients for Current User
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      // Assert Client == User
      const cli_col = db.collection('clients');
      const client = await cli_col.findOne({ usernames: req.user, _id: req.params.client })
      if (!client) return next(new errs.NotAuthorizedError('Not Authorized.'));

      const acc_col = db.collection('accounts');
      const accounts = await acc_col.find({ client: req.params.client }).toArray();
      res.send(accounts);
      next();
  });

  const get_transactions = // Get Transactions for Account
  async (req, res, next) => {
    const acc_col = db.collection('accounts');
    const account = await acc_col.findOne({ _id: req.params.account });

    // Assert Client == User
    const cli_col = db.collection('clients');
    const client = await cli_col.findOne({ usernames: req.user, _id: account.client })
    if (!client) return next(new errs.NotAuthorizedError('Not Authorized.'));

    const search_query = { src: req.params.account, ref: {'$regex': req.params.search} };
    if (req.params.from || req.params.to) { search_query.time = {} };
    if (req.params.from) search_query.time['$gte'] = parseInt(req.params.from);
    if (req.params.to) search_query.time['$lte'] = parseInt(req.params.to);

    const trans_col = db.collection('transactions');
    const transactions = await trans_col.find(search_query).toArray();
    res.send(transactions);
    next();
  };

  server.get('/transactions/:account/:search',
    Passport.authenticate('bearer', { session: false }), get_transactions);

  server.get('/transactions/:account/:search/:from',
    Passport.authenticate('bearer', { session: false }), get_transactions);

  server.get('/transactions/:account/:search/:from/:to',
    Passport.authenticate('bearer', { session: false }), get_transactions);

  server.post('/transactions', // Create Transaction
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      if (!(req.body.type && req.body.src && req.body.dest && req.body.amount && req.body.ref ))
        return next(new errs.MissingParameterError("Missing transaction fields."));

      if (req.body.time && (parseInt(req.body.time) <= Date.now()))
        return next(new errs.PreconditionFailedError("Invalid future transaction."));

      const acc_col = db.collection('accounts');
      const account = await acc_col.findOne({ _id: req.body.src });

      // Assert Client == User
      const cli_col = db.collection('clients');
      const client = await cli_col.findOne({ usernames: req.user, _id: account.client })
      if (!client) return next(new errs.NotAuthorizedError('Not Authorized.'));

      if (parseInt(req.body.amount) > account.balance)
        return next(new errs.PreconditionFailedError("Insufficient balance."));

      const transaction = {
        _id: uuidv3(`${req.body.src}:${req.body.time || Date.now()}`, UUID_NAMESPACE),
        time: (parseInt(req.body.time) || Date.now()),
        type: req.body.type,
        src: req.body.src,
        dest: req.body.dest,
        amount: parseInt(req.body.amount),
        balance: account.balance - parseInt(req.body.amount),
        ref: req.body.ref
      }
      account.balance = transaction.balance;

      await acc_col.replaceOne({ _id: account._id }, account, { upsert: true });
      const trans_col = db.collection('transactions');
      await trans_col.replaceOne({ _id: transaction._id }, transaction, { upsert: true });

      res.send(transaction);
      next();
  });

  server.get('/generic/:id', // Get Generic Item by _id, owned by a single user.
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      const collection = db.collection('generic');
      const item = await collection.findOne({ username: req.user, _id: req.params.id })
      if (!item) return next(new errs.NotAuthorizedError('Not Authorized.'));
      res.send(item);
      next();
  });

  server.post('/generic', // New generic item
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      req.body.username = req.user;
      req.body._id = uuidv3(`${Date.now()}:${req.user}`, UUID_NAMESPACE);

      const collection = db.collection('generic');
      const item = await collection.replaceOne({ _id: req.body._id }, req.body, { upsert: true });

      res.send(item);
      next();
  });

  server.del('/generic/:id', // Delete Generic Item by _id, owned by a single user.
    Passport.authenticate('bearer', { session: false }),
    async (req, res, next) => {
      const collection = db.collection('generic');
      const item = await collection.findOne({ username: req.user, _id: req.params.id })
      if (!item) return next(new errs.NotAuthorizedError('Not Authorized.'));

      await collection.deleteOne({ _id: req.params.id })

      res.send(item);
      next();
  });

  server.listen(8080, () => { console.log(`Listening: ${server.url}`) });
})();
