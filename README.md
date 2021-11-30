# WhatsApp Dashboard

This is the UI for WhatsApp Business API onboarding.

## Background

- WhatsApp Business APIs does not allow end users (businesses) to have direct access to their api and credentials.
- Instead business must go through a Business Support Partner (KeyReply is one).
- Previously there was limited api support for on boarding of users, hence Facebook Business Accounts and WhatsApp Business Accounts (WABA) had to be set manually in the Facebook portal.
- Facebook has a pending release for an embedded sign up which will allow a better UX for onboarding. However, this was pushed back due to the WhatsApp privacy issue.
- This project is currently in MVP stage, and is meant to automate the above, plus eventually automate document signing and billing. The current focus is on self serve onboarding.

## Basic Functionality

Roles:

- User
- Partner (User with partner attached)
- Admin (KeyReply personnel)

As a User

- Create account and log in to dashboard with auth0
- Add WABA with or without partner token
- If valid partner token is present, account will be managed by partner
- Else, it will be managed by User
- Note that adding a multiple phone numbers for a single WABA requires repeating this process multiple times (WhatsApp limitation)

As a Partner

- Create partner tokens
- Revoke partner tokens
- View accounts managed by partner

As an Admin

- Create partner, attach partner to User
- Enable/disable credit line as a means to gate keep the use of a WABA. Admin can manually allow use of credit line after required documents have been completed.
- Using this project, KeyReply will be considered another partner

## Related Documents

- https://app.clickup.com/t/5dwafu

## Development Setup

- use workspace `whatsapp-self-serve.code-workspace`.
- use node 14

### Install and Turn On Mock Servers

```bash
cd mockFbLoginServer
npm i
node index.js

cd mockAuth0Server
npm i
node index.js
```

### Setup Database and Server

Build the project:

- We use Gradle as our build tool
- You can install gradle on your environment or use the included gradle wrapper.
- For mac/linux user, you might need to grant execute permission to gradle wrapper:

```bash
sudo chmod +x gradlew
```

Create Database:

- Install postgres from https://www.postgresql.org/download/
- Login to the default user (if on macos, double click on the database called postgres to get a shell)
- Run `CREATE DATABASE whatsapp;`

Build Server and install dependencies:

```bash
cd server

gradle build

// Or alternative by using gradle wrapper
./gradlew build

cp .env.sample .env
```

Sync Database schema:

```bash
cd server
npm run generate-prisma-migration -- init
npm run deploy-prisma-migrations
npm run generate-prisma-client # This is required during build as well
```

Run Debugger

- In vscode, go to "Run and Debug" and run "Debug WhatsApp Server (server)"
  - This will build the typescript and run the server
  - Restart the debugger to view saved changes
  - Appropriate .env values are required or not server will error on startup

### Setup Dashboard

```bash
cd dashboard

// To build and start dashboard
gradle start

// To build the project only
gradle build

```

- Visit https://localhost:3000/
  - note that https is required for Facebook authentication

## TODO

- add internationalization for english (after onboarding step is done)
- one time show, bcrypt partner API Key for embedded use
  - Create section to create client/secret pair so that partners can make api call to retrieve a generated partner token
- for non embedded partner usage, add a button for partner to authorize
- App Domain for allowed origin page
- Add seed by migrating and creating user with known email

## Important Notes

- \*\*\* Can our third-party partners (ISVs) use the embedded signup flow on their website?
  - Only BSPs are able to use the embedded signup flow on their websites. We do not permit the use of the flow on any third party properties. We will provide more guidance if this changes.
  - might need to redirect and send a JWT in query params
- If user chooses wrong BSP when signing up using other BSP, they automatically get KeyReply line of credit!
  - the video suggests that it should be added manually though
  - Billing and Payment - How will businesses pay for WhatsApp Business API access? - Businesses that sign up through the Embedded signup flow will
    automatically request and be granted access to the BSP’s line of credit to pay for API access. This means that businesses will pay the BSP, and the BSP will receive an aggregated invoice to pay Facebook.
- React 17 has an issue where XHR requests are sent twice when api call is made from a react component
- React Router has a similar issue https://www.facebook.com/business/help/2225184664363779?id=2129163877102343
- At this time, a business can only share access to their WABA with one party: the BSP
- are our partners considered Independent Software Vendors (ISV) and System Integrators (SI)?

## Auth0

- tenant settings > advanced > Log in session management
  - set Inactivity timeout to 1 min
  - set Require log in after to 1 min
  - edit: may not be needed after adding `prompt: 'login'` to authorize

## Facebook

- add system user (employee) with Finance Editor (Edit > Finance Role)
- Generate token for use in server
- Request permissions for 'business_manager' and 'whatsapp_business_manager'
- seems like the number and waba is shared via the Facebook app that was used
- I think since they switched FB Apps to not have a dev mode, I am not able to get the log in page to work

## Embedded

- partner just makes an api call with client id and secret key in header and send the access code, we can then authenticate the partner and create the user's account
- keyreply should be another partner

## Partner switching

- put checkbox to confirm using/ not using partner
- input partner specific token
- changes should take 1 day to take effect (as whatsapp analytics granularity is by 1 day)

## Deployment

### Prepare Azure credential

```bash
az acr login --resource-group keyreply-app-resources --name keyreply
```

### Build and release

#### **Current server version: 0.1.31 (Make sure to update on new deployment)**

#### **Current dashboard version: 0.1.24 (Make sure to update on new deployment)**

#### *The below steps will do the release for **both dashboard and server**. If you only want to release dashboard or server separately, just cd to dashboard/server directory before executing the command*

#### *e.g we want to release version 1.0.0*

1. We will use annotated tag without signing so probably you need to set it into your git config

    ```bash
    git config --global tag.forceSignAnnotated false
    ```

2. Create git tag and push to origin

    ```bash
    git tag -a 1.0.0 -m "v1.0.0"
    git push origin 1.0.0
    ```

3. Build and push the docker images to remote repository

    ```bash
    gradle release
    // Or alternative by using gradle wrapper
    ./gradlew release
    ```

### Update deployment version

```bash
kubectl -n duy set image deployment wa-self-serve-server wa-self-serve-server=keyreply.azurecr.io/whatsapp-self-serve/server:<version_tag>
kubectl -n duy set image deployment wa-self-serve-dashboard wa-self-serve-dashboard=keyreply.azurecr.io/whatsapp-self-serve/dashboard:<version_tag>
```
