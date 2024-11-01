

```
curl -X POST http://localhost:3030/register -H "Origin: http://localhost:3001" -H "Content-Type: application/json" -d '{"username":"testuser","email":"test@example.com"}'
"User registered successfully."

quyen@🏵 :~/learning_occurl -X GET http://localhost:3030/usersGET http://localhost:3030/users
```


Run application

```
cd src/cargo build; cargo run
cd server/node server.js
cd frontend/src/npm install; npm start
```

Parallel run PostgresSQL as well as database.