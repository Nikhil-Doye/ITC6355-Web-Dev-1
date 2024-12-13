# Slice Haven Pizza Website

A full-stack web application for Slice Haven Pizza, offering an interactive menu, dynamic cart functionality, secure user authentication, and checkout options for pickup or delivery.

## Features

### **Frontend**
- **Dynamic Menu Page**: Fetches menu items from the backend and displays them with images, descriptions, and prices.
- **Interactive Cart**: Allows users to add, update, and remove items with real-time updates.
- **User Authentication**:
  - Login and registration using email and password.
  - Social login via Google.
- **Checkout Options**:
  - Pickup or delivery selection.
  - Address form for delivery.
- **Responsive Design**: Optimized for various screen sizes.

### **Backend**
- **API Endpoints**:
  - `GET /api/menu`: Fetch menu items.
  - `POST /api/login`: Authenticate users and generate JWT.
  - `POST /api/register`: Register new users.
  - `GET /api/cart`: Retrieve cart items for logged-in users.
  - `POST /api/cart`: Add items to the cart.
  - `PUT /api/cart`: Update item quantities in the cart.
  - `DELETE /api/cart/:id`: Remove items from the cart.
  - `POST /api/cart/checkout`: Handle checkout logic.
- **Authentication**:
  - Session-based authentication using Passport.js.
  - JSON Web Token (JWT) for secure API requests.
- **Database**:
  - PostgreSQL database for storing menu items, users, and cart data.
- **Security**:
  - Environment variables for sensitive data.
  - Hashing passwords with bcrypt.

## Installation

### **Requirements**
- Node.js and npm
- PostgreSQL

### **Setup**

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo-url/slice-haven-pizza.git
   cd slice-haven-pizza
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database named `pizza_cafe`.
   - Run the provided SQL script to initialize the tables:
     ```sql
     CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       password VARCHAR(255)
     );

     CREATE TABLE menu_items (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255),
       description TEXT,
       price NUMERIC(10, 2),
       image_url TEXT
     );

     CREATE TABLE cart_items (
       id SERIAL PRIMARY KEY,
       user_id INT REFERENCES users(id),
       pizza_id INT REFERENCES menu_items(id),
       quantity INT NOT NULL
     );
     ```

4. Configure environment variables:
   - Create a `.env` file in the root directory:
     ```env
     PORT=3000
     DATABASE_URL=postgres://username:password@localhost:5432/pizza_cafe
     JWT_SECRET=your_secret_key
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     ```

5. Start the server:
   ```bash
   npm start
   ```

6. Access the application at `http://localhost:3000`.

## Usage

1. **Browse the Menu**:
   - View pizzas, their descriptions, and prices.

2. **User Authentication**:
   - Register or log in to your account.
   - Use Google login for quick access.

3. **Add Items to Cart**:
   - Select quantities and add items to your cart.

4. **Manage Your Cart**:
   - Update quantities or remove items.

5. **Checkout**:
   - Choose between pickup and delivery.
   - Provide a delivery address if required.

## Folder Structure

```
project-root/
├── public/
│   ├── css/
│   ├── images/
│   └── js/
├── views/
│   ├── index.html
│   ├── menu.html
│   ├── cart.html
│   ├── login.html
│   └── location.html
├── .env
├── server.js
└── package.json
```

## API Documentation

### **Endpoints**

- **GET /api/menu**
  - Fetch all menu items.
  - Response:
    ```json
    [
      {
        "id": 1,
        "name": "Margherita Pizza",
        "description": "Fresh tomatoes, mozzarella, basil, olive oil",
        "price": 12.99,
        "image_url": "/images/margherita.jpg"
      }
    ]
    ```

- **POST /api/register**
  - Register a new user.
  - Request:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```

- **POST /api/login**
  - Authenticate a user.
  - Response:
    ```json
    {
      "success": true,
      "token": "jwt-token"
    }
    ```

- **GET /api/cart**
  - Fetch the current user's cart items.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js, JWT
- **Other**: dotenv, bcrypt

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.

