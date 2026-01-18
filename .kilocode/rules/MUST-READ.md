# YOU MUST NOT IGNORE THE DETAILS BELOW

### DO NOT use plawright npm package for testing, you MUST use Playwright MCP Server

### Config is:

- postgres on port 5432 in a docker container
POSTGRES_USER=totalevo_user
POSTGRES_PASSWORD=totalevo_password
POSTGRES_DB=bar_pos

- app credentials
admin user: admin
admin password: admin123

app is available at http://192.168.1.241:3000


## General Behaviour
Frontend and backend servers are running in docker
to run test new features and fixes you need to use the command
'docker compose up -d --build'

Before starting backend or frontend server, make sure they are not already running

NO Workarounds! NO shortcuts! ONLY proper coding!

## ALWAYS USE SUBTASKS TO KEEP TOKEN USAGE AT A MINIMUM

Frontend is running on port 3000

### We are testing from LAN with a browser, NOT from localhost

## DO NOT EVER kill all npm processes. ONLY stop the necessary processes required to achieve your current goal


### ALL documentation must be located at ./docs

## ALL testing must be done it their own subtasks and all test files must be in the ./test-files folder

### do not rush! always make sure you are editing things right. the goal is here is quality and not speed