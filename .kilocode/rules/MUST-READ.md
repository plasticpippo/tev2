# YOU MUST NOT IGNORE THE DETAILS BELOW

## NO EMOJIS anywhere in the frontend!!! 

### DO NOT use plawright npm package for testing, you MUST use Playwright MCP Server

### Config is:

- postgres on port 5432 in a docker container
check .env file for username and password and other important details

- app credentials
admin user: admin
admin password: admin123

app is available at http://192.168.1.12:80


## General Behaviour
Frontend and backend and db servers are running in docker
to run test new features and fixes you need to use the command
'docker compose up -d --build'

Before starting backend or frontend server, make sure they are not already running

NO Workarounds! NO shortcuts! ONLY proper coding!

## ALWAYS USE MICRO SUBTASKS TO KEEP TOKEN USAGE AT A MINIMUM


### We are testing from LAN with a browser, NOT from localhost
# Instructions for e2e testing
 - do NOT use test files
 - use playwright mcp server to directly browse the app
 - ALL testing must be done it their own subtasks and all test files must be in the ./test-files folder

## DO NOT EVER kill all npm processes. ONLY stop the necessary processes required to achieve your current goal


### ALL documentation must be located at ./docs

### do not rush! always make sure you are editing things right. the goal is here is quality and not speed