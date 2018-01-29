# DCAP

ᴅᴇᴄᴇɴᴛʀᴀʟɪᴢᴇᴅ ᴄᴏɴᴛᴇɴᴛ ᴀɢɢʀᴇɢᴀᴛɪᴏɴ ᴩʟᴀᴛꜰᴏʀᴍ

DCAP allows you to easily create and manage well-structured documents that are stored on IPFS. A simple user account system tied to a PGP keypair allows you to encrypt and decrypt your documents over an easy-to-use REST API.

With DCAP you can create document types for things such as notes, todos, chat messages, web page data, social network updates and more. These documents will be stored on the decentralized IPFS network and pinned by the API to ensure accessibility. You can choose to store your documents in plaintext for all to see or encrypt them for privacy. DCAP's API makes it easier to create and retrieve these decentralized documents in your website and apps.

## Setup
### Requirements
- Node.js
- [MongoDB](https://docs.mongodb.com/manual/installation/)

### Installation
Clone this repository and run `npm install`. Copy the sample configuration file (`.env.example`) to `.env` and edit it to match your desired configuration. Run `npm start` to start DCAP on `http://localhost:5000`. Please use this with SSL on production environments.

### Configuration
The main configuration is loaded from `.env`. You can change the security behavior and whether DCAP should pin IPFS documents from these settings.

In the `/src/config/types` directory are the type definitions that DCAP uses to validate the content you post. These must be written in [JSON Schema](http://json-schema.org) to be validated by DCAP. You can use the example types that come bundled with DCAP but will probably want to add some more attributes to make them useful.

**Example type configuration**
```
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "title": "note", // Type name as referenced in API requests
  "description": "Simple note content type",
  "type": "object",
  "encrypted": true, // Set to false to make document publicly readable
  "properties": {
    "text": {
      "type": "string"
    }
  },
  "required": [ // Required field names
    "text"
  ]
}
```

## API Reference

[`POST /user/create`: Create New User](#create-new-user)

[`POST /user/login`: Login User](#login-user)

🔑 [`POST /user/delete`: Delete Account](#delete-account)

[`GET /type/:type`: Get Type Index](#get-type-index)

[`GET /type/:type/schema`: Get Type Schema](#get-type-schema)

🔑 [`POST /type/:type`: Add New Document](#add-new-document)

🔑 [`POST /type/:type/:hash`: Get Decrypted Document](#get-decrypted-document)

[`GET /document/:hash`: Get Unencrypted Document](#get-unencrypted-document)

🔑 [`PUT /type/:type/:hash`: Update Document](#update-document)

🔑 [`DELETE /type/:type/:hash`: Delete Document From Index](#delete-document-from-index)


🔑: Requires authentication token. This token (sent to you on login) can be passed to authorized endpoints via the `token` attribute in the request body, via a `token` query parameter, or with an `x-access-token` HTTP header. This token must be refreshed every 24 hours.

### Create New User
`POST /user/create`

Creates a new user and generates a PGP keypair. The public key will be stored in the database but you must keep your private key secure as it will be used to encrypt and decrypt your documents.

**Request Body**
```
{
  "username": "testuser",
  "password": "abc123"
}
```

**Success Response**
```
HTTP/1.1 200 OK
{
  "success": "User created",
  "pub_key": "-----BEGIN PGP PUBLIC KEY BLOCK-----....",
  "priv_key": "-----BEGIN PGP PRIVATE KEY BLOCK-----..."
}
```

**Error Responses**
- `500` Key Creation Failed
- `500` User Creation Failed


### Login User
`POST /user/login`

Logs user in and returns a JWT token to submit with authorized requests.

**Request Body**
```
{
  "username": "testuser",
  "password": "abc123"
}
```

**Success Response**
```
HTTP/1.1 200 OK
{
  "success": "Login succeeded",
  "token": "eyJhbGciOi..."
}
```

**Error Responses**
- `401` User not found
- `401` Wrong Password
- `401` User Login Failed


### Delete Account
🔑 `POST /user/delete`

Deletes your user account. Stored documents are not removed from their types.

**Request Body**
```
{
  "token": "eyJhbGciOi...", // Token can also be sent as x-access-token header
  "password": "abc123"
}
```

**Success Response**

```
HTTP/1.1 200 OK
{
  "success": "User successfully deleted"
}
```

**Error Responses**
- `401` Password must be supplied
- `401` Username not found in token
- `401` Incorrect password
- `403` User deletion failed


### Get Type Index
`GET /type/:type[?username=:username]`

Gets list of documents for a given type. You can also filter documents by username with the username query parameter.

**URL Params**
- `:type` Type name

**Query Params**
- `:username`: Username to filter documents by

**Success Response**

```
HTTP/1.1 200 OK
{
  "documents": [
    {
      "created": 1515884391549,
      "updated": 1515884391549,
      "username": "testuser",
      "link": {
        "/": "QmcxBLD2MCcqEw1q5L3xqxDiSMkYHnoe4LYLskTn7vhwci"
      }
    },
    ...
  ],
  "hash": "QmQ5SBZnsAbZ1BEmsAZe8keBDbUwQMzuc2ZF7njYDE5Bum" // IFPS reference to this index
}
```

**Error Responses**
- `404` Type not found


### Get Type Schema
`GET /type/:type/schema`

Retrieve the schema specification for a given type.

**URL Params**
- `:type` Type name

**Success Response**

```
HTTP/1.1 200 OK
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "title": "note",
  ...
}
```

**Error Responses**
- `404` Type not found


### Add New Document
🔑 `POST /type/:type`

Create a new document and store it to the type index. The document data must be passed in the body's `data` field. This data will be validated against the type's schema. If the type schema indicates the document should encrypted, a password and private key must be passed in the request body.

**URL Params**
- `:type` Type name

**Request Body**
```
{
  "data": { "text": "foo bar"}, // Must match type schema
  "password": "abc123", // Required if type is encrypted
  "priv_key": "-----BEGIN PGP PRIVATE KEY BLOCK-----..." // Required if type is encrypted
}
```

**Success Response**

```
HTTP/1.1 200 OK
{
  "success": "Document created",
  "hash": "QmaCSJeLMJYpbecr3Qft4w2CQQDmQo9w8Y5DPQmf9ptGVL"
}
```

**Error Responses**
- `401` Username not found in token
- `404` Type does not exist
- `500` Must supply data object in request body
- `500` Private key not passed in request body
- `500` Password not passed in request body
- `500` Document already exists


### Get Decrypted Document
🔑 `POST /type/:type/:hash`

Fetches IPFS document and decrypts it if encrypted (otherwise behaves the same as `GET /document/:hash`).

**URL Params**
- `:type` Type name
- `:hash` Document hash

**Request Body**
```
{
  "token": "eyJhbGciOi...", // Token can also be sent as x-access-token header
  "password": "abc123", // Required if type is encrypted
  "priv_key": "-----BEGIN PGP PRIVATE KEY BLOCK-----..." // Required if type is encrypted
}
```

**Success Response**

```
HTTP/1.1 200 OK
{
  "text": "foo bar"
}
```

**Error Responses**
- `404` Type not found
- `404` User not found
- `401` Password and/or private key not included in request body


### Get Unencrypted Document
`GET /document/:hash`

Gets raw document by hash from IPFS. This is functionally equivalent to `ipfs cat <ref>`

**URL Params**
- `:hash`: IPFS document hash

**Success Response**

```
HTTP/1.1 200 OK
"-----BEGIN PGP MESSAGE-----..."
```


### Update Document
🔑 `PUT /type/:type/:hash`

Update an existing document and replace its hash in the type index with the newly saved document.

**URL Params**
- `:type` Type name
- `:hash` Document hash

**Request Body**
```
{
  "username": "testuser",
  "password": "abc123"
}
```

**Success Response**

```
HTTP/1.1 200 OK
{
  "success": "Document updated",
  "hash": "QmaCSJeLMJYpbecf5Qft4w2CQQDmQo9w8Y5DPQmf9ptGw4..."
}
```

**Error Responses**
- `401` Username not found in token
- `403` Invalid username for this document
- `404` Document to update not found
- `404` Type does not exist
- `500` Must supply data document in request body
- `500` Private key not passed in request body
- `500` Password not passed in request body


### Delete Document From Index
🔑 `DELETE /type/:type/:hash`

Removes document from type index. Does not remove the actual (immutable) IPFS document.

**URL Params**
- `:type` Type name
- `:hash` Document hash

**Success Response**

```
HTTP/1.1 200 OK
{
  "success": "Document removed from type index",
  "hash": "QmcxBLD2MCcqEw1q5L3xqxDiSMkYHnoe4LYLskTn7vhwci"
}
```

**Error Responses**
- `401` Username not found in token
- `403` Invalid username for this document
- `404` Document to remove not found
- `404` Type does not exist


## Contributing
Contributions are welcome. Please see github issues for open bugs or feature requests, or to submit your own. DCAP has integration tests which should be run (`npm run test`) and updated for new code contributions. This project uses Typescript and all code should be accepted by Typescript's linter.

## License
Copyright (c) 2018 Matt Crider.

Licensed under the [MIT License](LICENSE).
