# Employee Manager App

A full-stack Employee Management application built with Spring Boot and Angular.  
The app allows users to manage employee records through a REST API and a responsive frontend interface.

## Features

- Create, view, update, and delete employees
- Search employees by name, email, or job title
- Display employee details such as job title, phone number, image, status, birthday, hire date, and contract information
- Employee statistics overview
- Upcoming birthday, anniversary, and contract-ending sections
- Responsive Angular frontend
- RESTful backend API with Spring Boot
- MySQL database integration

## Tech Stack

### Backend

- Java
- Spring Boot
- Spring Data JPA
- Maven
- MySQL

### Frontend

- Angular
- TypeScript
- HTML
- CSS
- Bootstrap / Font Awesome

## Project Structure

```text
employee-manager-app/
├── backend/
│   └── employee-manager/       # Spring Boot REST API
├── frontend/
│   └── employeemanagerapp/     # Angular frontend application
└── README.md
```

## Setup and Run

### Prerequisites

Make sure you have installed:

- Java
- Maven or the included Maven Wrapper
- Node.js and npm
- Angular CLI
- MySQL

## Backend Setup

Navigate to the backend project:

```bash
cd backend/employee-manager
```

Run the Spring Boot application:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell, use:

```bash
.\mvnw spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

## Frontend Setup

Navigate to the frontend project:

```bash
cd frontend/employeemanagerapp
```

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
npm start
```

The frontend runs on:

```text
http://localhost:4200
```

## Database Configuration

The backend uses MySQL. Update the database settings in:

```text
backend/employee-manager/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/employeemanager
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

Make sure a MySQL database named `employeemanager` exists before starting the backend.

## API Overview

Base URL:

```text
http://localhost:8080/employee
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/all` | Get all employees |
| GET | `/find/{id}` | Get employee by ID |
| POST | `/add` | Add a new employee |
| PUT | `/update` | Update an existing employee |
| DELETE | `/delete/{id}` | Delete an employee |

## Purpose

This project demonstrates a practical full-stack CRUD application using a Spring Boot REST API, MySQL database, and Angular frontend. It focuses on clean project structure, frontend-backend communication, and real-world employee management functionality.
