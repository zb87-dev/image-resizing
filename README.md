# image-resizing

Solution for image resizing using Amazon SQS and separate workers used for image conversion.

# In order to run the project, run the following steps:

## 1.Database setup

Create owner of the PostgreSQL database

```
CREATE ROLE [role-name] WITH
LOGIN
SUPERUSER
CREATEDB
CREATEROLE
INHERIT
NOREPLICATION
CONNECTION LIMIT -1
PASSWORD '[user-password]';
```

Create database and assign previously created owner to it

```
CREATE DATABASE [database-name]
WITH
OWNER = [role-name]
ENCODING = 'UTF8'
LOCALE_PROVIDER = 'icu'
CONNECTION LIMIT = -1
IS_TEMPLATE = False;
```

## 2. Environment setup

Open **api** folder and copy sample.env into .env file and adjust the values accordingly.
Do the same for the **worker** and **frontend** projects.

## 3. NodeJS version

Make sure to use latest NodeJS LTS version (v20.15.0) on your machine

In order to manage multiple NodeJS versions on your host machine, you can use tool called NVM. This solution supports it, so you can just type in the terminal

> nvm install v20.15.0

Then type

> nvm use

## 4. Run project setup

Inside the terminal, navigate to the root folder of the project and then type in your terminal

> npm run setup

This command will install dependencies for all projects.

## 5. Run the server

In order to run the server, execute the following command:

> npm run server

## 6. Run the worker

In the separate terminal(s), start the worker(s) using the following command

> npm run worker

## 7. Run the frontend

> npm run frontend

## 8. Open the app

To run the app, open http://localhost:3001

## Running e2e tests

In order to run e2e tests, open **api** folder and create test.env with appropriate values. Then you can run

> npm run test:e2e

# Additional information

Sometimes SQS messages are lost, so from time to time there are stuck conversion jobs in the pending state.
To solve this, cron service is implemented that is getting pending jobs older than 1 minute and resends them to the SQS.

At the moment, updating UI is done via polling every 500ms. In order to make UI more responsive, websockets or server sent events could be implemented.

When sending SQS message from worker to the api, i used already created **-failed** SQS queue, instead of the other one, since i didn't have permissions to create new queue for that purpose.
