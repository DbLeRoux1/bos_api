# Bank of the Sun Transaction API
## NB: This is a dummy API for Student Projects

# Endpoints

## POST /user
Create new user, requires username/password combo.
```
{ "username": "someuser", "password": "somepassword" }
```

## GET /apply
To be completed.

## GET /clients
Retrieve clients for authenticated user.

Example client object:
```
[{
  "_id": "36fc7b7f-dc97-46e2-a15c-a6ca810e1d1b",
  "dob": "1970-09-02T09:30:57Z",
  "email": "harold.ferguson@example.com",
  "first": "harold",
  "id": "PL 33 59 21 O",
  "last": "ferguson",
  "title": "mr",
  "usernames": ["lazymeercat116"]
}]
```

## GET /accounts/:client
Retrieve accounts for specified client UUID.

Example account object:
```
[{
  "_id": "4d57aa2f-a0fb-39d7-b6ca-e584a7bc5324",
  "balance": 138400,
  "client": "36fc7b7f-dc97-46e2-a15c-a6ca810e1d1b",
  "description": "harold's cheque account",
  "type": "cheque"
}]
```

## GET /transactions/:account/:search[[/:from]/:to]
Retrieve transactions for given accounts and search query.
Search query is a regular expression. Specify `.*` for all transactions.
from and to are optional, which should be javascript unix time stamps.

Examples:
```
http://api.url/transactions/4d57aa2f-a0fb-39d7-b6ca-e584a7bc5324/.*
http://api.url/transactions/4d57aa2f-a0fb-39d7-b6ca-e584a7bc5324/.*/1539074878074
http://api.url/transactions/4d57aa2f-a0fb-39d7-b6ca-e584a7bc5324/.*/1539074878074/1539074784664
```

## POST /transactions
Post a new transaction, requires a body object as below.

```
{
  "time": Unix Timestamp # Optional, for post-dated transactions,
  "type": Type of transaction, accepts all types,
  "src": Source Account,
  "dest": Destination Account or bank info (freeform text),
  "amount": Cents (integer),
  "ref": Reference Text
}
```
# Authentication
See `demo.htm`:

```
const user = 'lazymeercat116';
const password = 'hottest';

const hmac = new jsSHA('SHA-256', 'TEXT');
hmac.setHMACKey(password, 'TEXT');
hmac.update(user);
hmac.update(Date.now().toString(36).substring(0, 4));

const token = `${hmac.getHMAC('HEX')}%${user}`;
```
