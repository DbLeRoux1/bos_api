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

Example transaction object:
```
[{
  "_id": "a43a1e1e-d0b5-3aa7-b063-73e42dd1c078",
  "amount": 106124,
  "balance": 106124,
  "dest": "febec4ad-3472-41ac-b43a-d31591ea978f",
  "ref": "402878",
  "src": "4d57aa2f-a0fb-39d7-b6ca-e584a7bc5324",
  "time": 1435533455204,
  "type": "credit"
}]
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

## GET /generic/:id
Return an arbitrary object by ID. Object must be owned by current user.

## DELETE /generic/:id
Delete and return an arbitrary object by ID. Object must be owned by current user.

## POST /generic
Create a new object (specified as body). Note that a username and \_id field will be computed automatically and will be replaced if they already exist.

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

# Generic API

The generic API contains a subset of these API calls but on port 8081. Only the three `/generic` calls are available as well as the create user call (`\user`). The three generic calls are renamed `/item` in this variant.
