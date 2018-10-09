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

## GET /accounts/:client
Retrieve accounts for specified client UUID.

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
