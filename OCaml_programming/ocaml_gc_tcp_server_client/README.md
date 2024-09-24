# Technical Specification: Secure TCP Server and Client

## Overview
This document provides the technical specification for the design and
implementation of a **TCP Server** and **TCP Client** in OCaml, focusing on
secure message transmission. The system is designed to demonstrate the benefits
of OCaml's automatic garbage collection (GC) while ensuring message integrity,
confidentiality, and authenticity through cryptographic techniques such as
hashing and digital signatures.

The TCP server listens for incoming client connections, process requests, and
send reponses. The TCP client connects to the server, send requests, and
processes the server's responses. Both the client and server use secure message
encoding and decoding mechanisms to prevent message tampering during
transmission.

## Objectives
- Develop a **TCP Server** that handles multiple concurrent clients, securely
  processes incoming messages, and responds appropriately.
- Implement a **TCP Client** that connects to the server, send secures requests,
  and receives responses.
- Ensure message integrity and authenticity through cryptographic techniques
  like hashing (using Blake2b or HMAC) and digital signatures.
- Demonstrate the advantages of OCaml's Garbage Collection (GC) by efficiently
  managing dynamically allocated memory during message transmission and
  processing.
- Safeguard against common networking issues, such as server overload and
  connection failure, by handling error gracefully.

---

## System Components

### TCP Server
The TCP Server follows the basic steps for managing client connections securely:
1. Create a TCP Socket:
- Create a TCP socket using `Lwt_unix.socket`.
2. Bind the Socket to a Specific Address:
- Bind the socket to `localhost` and port `8080` using `Lwt_unix.bind`
3. Listen for Incoming Connections:
- Start listening for client connections using `Lwt_unix.listen`.
4. Accept Client Connections:
- Accept incoming client connections using `Lwt_unix.accept`. A new socket is
  created for each client connection.
5. Receive and Process Data:
- For each connected client, receive the message, decode it, and verify its
  integrity using cryptographic hashes (Blake2b).
6. Formulate and Send a Response:
- After processing the client's message, the server responds with an encoded,
  hashed, and optionally signed message.
7. Close the Client Connection:
- Once the message is processed and the response is sent, close the client
  connection to free up resources.
8. Concurrency Handling:
- Each client connection is processed in a separate `Lwt` thread, allowing
  multiple clients to connect concurrently.

### TCP Client
The TCP client connects to the server and communicates securely using the
following steps:
1. Create and Establish a TCP Connection:
- The client creates a TCP socket using `Lwt_unix.socket` and connects to the
  server at `localhost:8080`.
2. Send a Secure Request:
- The client encodes a message, computes its hash, and optionally signs it
  before sending it to the server.
3. Receive and Process the Server's Response:
- The client decodes the server's response, verifies its integrity by checking
  the hash, and optionally verifies the signature.
4. Close the Connection:
- After receiving the response, the client closes the connection.

### Message Structure
To ensure secure communication, each message follows a well-defined structure:
- Message Type (`msg_type`): Specifies whether the message is a `Request`,
  `Response`, or an `Error`.
- Payload (`payload`): The actual data being transmitted, which could be a
  string, JSON, or binary data.
- Timestamp (`timestamp`): A timestamp to prevent replay attacks and add
  temporal context.
- Hash (`hash`): A cryptographic hash of the message content (excluding the hash
  itself) to ensure integrity.
- Signature (`signature`, optional): A digital signature of the message, signed
  using the sender's private key, for authenticity verification.

### Example Message (in JSON-like format for illustration)
```json
{
    "type": "Request",
    "payload": "Hello, Server!",
    "timestamp": "2024-09-24T12:34:56Z",
    "hash": "e5c9f8bb7b4f6c3ae287abb0d98c5f7e",
    "signature": "bXlfc2lnbmF0dXJl"
}
```

---

## Message Security Mechanisms
### Encoding and Decoding
- Encoding:
    - Each message is serialized into a string format (e.g., JSON) and
      Base64-encoded to ensure safe transmission over the network.
- Decoding:
    - The server and client decode received Base64 messages and parse the
      message structure to extract the contents.
### Hashing and Integrity Checks:
- Hash Generation:
    - A cryptographic hash (using Blake2b) is computed on the message contents
      to ensure integrity.
- Hash verification:
    - Upon receiving a message, the receiver recomputes the hash and compares it
      to the received hash to verify message integrity.
### Digital Signatures (Optional):
- Signing the Message:
    - The sender (client or server) signs the message using their private key to
      ensure authenticity.
- Signature Verification:
    - The receiver (client or server) verifies the message signature using the
      sender's public key to ensure the message was not tampered with.

---

## Concurrency Management

### Handle Multiple Clients Simultaneously
- The server using `Lwt.async` to create a new thread for each client
  connection, allowing the server to handle multiple clients concurrency without
  blocking.

### Simultaneously Requests
- If multiple clients send requests simultaneously, the server processes them
  concurrently using lightweight threads. Each client interaction runs
  independently, preventing bottlenecks.

### Server Overload Handling
- The server imposes a limit on the number of concurrent connections
  (configurable via `max_clients`). When this limit is reached, new client
  connections are rejected gracefully.

---

## Garbage Collection Benefits
### Automatic Memory Management
- OCaml's garbage collection automatically reclaims memory for connection
  buffers, request/response data, and cryptographic operations. Memory
  associated with each client interaction is efficiently cleaned up after the
  connection is closed.

### Preventing of Memory Leaks
- Since memory management is handled by OCaml's GC, the system prevents memory
  leaks even in long-running server applications, where clients connect and
  disconnect frequently.

---

## Error Handling
### Client Connection Failure
- If the client attempts to connect to the server when it is not running, the
  client gracefully handles connection failures, such as `Connection refused`.

### Server Overload
- If the server exceeds the allowed number of concurrent clients (`max_clients`)
  it gracefully rejects new connection attempts and logs a message.

---
## Command-Line Interface
### TCP Server CLI
- Start the Server: `./tcp_server start`
- View Active Connections: `./tcp_server connections`
- Stop the Server: `./tcp_server stop`
- Status Check: `./tcp_server status`
### TCP Client CLI
- Start the Client: `./tcp_client start`
- Send a Message: `./tcp_client send <message>`
- Sign a Message: `./tcp_client sign <message>`
- View Response: `./tcp_client response`
- Stop the Client: `./tcp_client stop`
- Client Status: `./tcp_client status`