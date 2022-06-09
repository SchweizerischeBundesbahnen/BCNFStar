#!/bin/bash
cat << EOF > /bcnfstar/.pgpass
$DB_HOST:$DB_PORT:$DB_DATABASE:$DB_USER:$DB_PASSWORD
EOF
chmod 600 /bcnfstar/.pgpass

npm start
