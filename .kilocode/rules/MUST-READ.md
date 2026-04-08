# YOU MUST NOT IGNORE THE DETAILS BELOW

## NO EMOJIS anywhere in the frontend!!! 

### DO NOT use plawright npm package for testing, you MUST use Playwright MCP Server

### Config is:

- postgres on port 5432 in a docker container
check .env file for username and password and other important details

- app credentials
admin user: admin
admin password: admin123

app is available at http://192.168.1.70


## General Behaviour
Frontend and backend and db servers are running in docker
to run test new features and fixes you need to use the command
'docker compose up -d --build'

Before starting backend or frontend server, make sure they are not already running

Docker container names of the app are
 - bar_pos_nginx
 - bar_pos_frontend
 - bar_pos_backend
 - bar_pos_backend_db

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

## Database Migrations - CRITICAL

### ALWAYS use Prisma migrations for schema changes

When modifying the database schema (adding tables, columns, indexes, relations):

1. **CORRECT** - Use Prisma migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name descriptive_name_of_change
   ```

2. **NEVER USE** - These bypass migrations and break fresh installations:
   ```bash
   npx prisma db push    # FORBIDDEN - Only for prototyping
   Manual SQL changes    # FORBIDDEN - Not tracked
   ```

### After schema changes, ALWAYS:

1. Generate the migration file: `npx prisma migrate dev --name add_xxx`
2. Verify migration file was created in `backend/prisma/migrations/`
3. Commit the migration file to version control
4. Test with a fresh database: `docker compose down -v && docker compose up -d --build`

### Why this matters

Missing migration files cause fresh installations to fail because:
- `docker-entrypoint.sh` runs `npx prisma migrate deploy` on startup
- This ONLY applies migration files - it does NOT read the schema
- If a model exists in schema but has no migration, the table won't exist
- This breaks deployments on new servers

### See troubleshooting guide at: `docs/troubleshooting-fresh-installation.md`
