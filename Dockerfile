FROM node:16-buster

# updates, install JAVA
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y openjdk-11-jdk ca-certificates-java dos2unix && \
    apt-get clean

# copy local repository
COPY . bcnfstar
WORKDIR /bcnfstar

# make executable and make compatible for windows users
RUN chmod +x entrypoint.sh
RUN dos2unix entrypoint.sh

# set environment variable
ENV DB_PASSFILE=/bcnfstar/.pgpass

# start BCNFStar
RUN npm install
RUN npm run build

ENTRYPOINT [ "/bcnfstar/entrypoint.sh" ]
