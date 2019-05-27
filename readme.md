# Homework Assignment #3

## Specifications
1. Code is refactored as `api/users` , `api/login`

## Run
```bash
node index.js // It will run server on default port

NODE_ENV=production node index.js // It will run server on production port
```

## Directions
1. Create New User Request {POST}
* **Required fields**: name, email, password, address, tosAgreement
* **Additional requests**: {GET, UPDATE, DELETE}
```bash
http://locahost:3000/user
```

2. Create Login Request {POST} (Token will be created)
* **Required fields**: email, password
```bash
http://localhost:3000/login
```

3. Create Logout Request {DELETE}
* **Required fields**: id
```bash
http://localhost:3000/logout?id=tokenid
```
4. Menu Request {GET}
* **Required fields**: email
* **Header fields**: token
```bash
http://localhost:3000/menu?email=navdeep.er@gmail.com
```
5. Create Cart Request {POST}
* **Required fields**: itemId
* **Header fields**: token
```bash
http://localhost:3000/cart
```
6. Update Cart Request {PUT}
* **Required fields**: id (cart id), itemId, action (update or delete) 
* **Header fields**: token
```bash
http://localhost:3000/cart
```
7. Order Request
* **Required fields**: cartId 
* **Header fields**: token
```bash
http://localhost:3000/order
```


