const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const uuidv4 = require('uuid/v4');
const uuidv3 = require('uuid/v3');

const UUID_NAMESPACE = "353ac1c0-cab3-11e8-9211-4f01514d4e40";

const rand_int = (min, max) => {
  [min, max] = [Math.ceil(min), Math.floor(max)];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const acc_types = ['cheque', 'savings', 'credit'];

(async () => {
  const mongo = await MongoClient.connect('mongodb://localhost:27017',
    { useNewUrlParser: true });
  const db = mongo.db('bos');

  const ru = await axios.get('https://randomuser.me/api?inc=name,email,login,dob,id&nat=gb&results=1000');

  for (let x = 0; x < ru.data.results.length; x++) {
    const client = {
      _id: ru.data.results[x].login.uuid,
      title: ru.data.results[x].name.title,
      first: ru.data.results[x].name.first,
      last: ru.data.results[x].name.last,
      email: ru.data.results[x].email,
      usernames: [ru.data.results[x].login.username],
      dob: ru.data.results[x].dob.date,
      id: ru.data.results[x].id.value
    }
    const user = {
      _id: ru.data.results[x].login.uuid,
      username: ru.data.results[x].login.username,
      password: ru.data.results[x].login.password
    }

    await db.collection('clients').replaceOne({ _id: client._id }, client, { upsert: true });
    await db.collection('users').replaceOne({ _id: user._id }, user, { upsert: true });

    for (let y = 0; y < rand_int(1, 3); y++ ) {
      const a_type = acc_types[rand_int(0, acc_types.length - 1)];
      const account = {
        _id: uuidv3(`${client._id}:${a_type}`, UUID_NAMESPACE),
        client: client._id,
        type: a_type,
        description: `${client.first}'s ${a_type} account`,
        balance:  rand_int(0, 10000) * 100
      }
      if (a_type === 'credit') account.credit_limit = Math.max(account.balance, rand_int(0, 10000) * 100);

      await db.collection('accounts').replaceOne({ _id: account._id }, account, { upsert: true });
    }
    console.log(`${user.username}: ${user.password}`)
    // console.log(client._id);
  }

  const time_end = Date.now();
  const accounts = await db.collection('accounts').find({}).toArray();
  for (let x = 0; x < accounts.length; x++) {
    let time_range = 1275393600000;
    let balance = 0;
    while (accounts[x].balance > 0) {
      const trans_stamp = rand_int(time_range, time_end);
      let trans_value = 0;
      if (accounts[x].balance <= 10000 || (time_end - time_range) <= 3600000) { trans_value = accounts[x].balance; }
      else { trans_value = rand_int(10000, accounts[x].balance); }
      if (trans_value < balance) { if (rand_int(0, 99) >= 50) trans_value *= -1; }
      balance += trans_value;
      let type = '';
      if (accounts[x].type === 'credit') {
        if (trans_value > 0) {
          type = 'purchase'; ref = `store purchase ${rand_int(100000, 999999)}`;
        } else {
          type = 'payment';  ref = `payment. thank you.`
        };
      } else {
        if (trans_value > 0) {
          type = 'credit'; ref = `${rand_int(100000, 999999)}`;
        } else {
          type = 'debit'; ref = `transfer ${rand_int(100000, 999999)}`;
        };
      }
      const transaction = {
        _id: uuidv3(`${accounts[x]._id}:${trans_stamp}`, UUID_NAMESPACE),
        time: trans_stamp,
        type: type,
        src: accounts[x]._id,
        dest: uuidv4(),
        amount: trans_value,
        balance: balance,
        ref: ref
      }
      await db.collection('transactions').replaceOne({ _id: transaction._id }, transaction, { upsert: true });
      time_range = trans_stamp;
      accounts[x].balance -= trans_value;
    }
  }

  // console.log(user);
  mongo.close();
})();
