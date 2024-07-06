# image-resizing

Solution for image resizing using Amazon SQS

# In order to run the project, run the following steps:

## 1.Database setup

Create owner of the PostgreSQL database

```
CREATE ROLE image_resizing_dev WITH
LOGIN
SUPERUSER
CREATEDB
CREATEROLE
INHERIT
NOREPLICATION
CONNECTION LIMIT -1
PASSWORD 'image_resizing_dev';
```

Create database and assign previously created owner to it

```
CREATE DATABASE image_resizing_dev
WITH
OWNER = image_resizing_dev
ENCODING = 'UTF8'
LOCALE_PROVIDER = 'icu'
CONNECTION LIMIT = -1
IS_TEMPLATE = False;
```

## 2. Environment

Enter inside the api folder and copy sample.env into .env file and adjust values accordingly.

## 3. NodeJS version

Make sure to use latest NodeJS LTS version (v20.15.0) on your machine

In order to manage multiple NodeJS versions on your host machine, you can use tool called NVM. This solution supports it, so you can just type in the terminal

> nvm install v20.15.0
> nvm use

## 4. Run project setup

Inside the terminal, navigate to the root folder of the project and then type in your terminal

> npm run setup

This command will install api and run database setup.

## 5. Run the server

In order to run the server, execute the following command:

> npm run server
