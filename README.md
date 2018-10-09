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
