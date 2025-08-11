docker build -t checkdocker .  -> bulid image

docker volume create checkvol  -> create docker volume

docker network create checknetwork  -> create network

docker run -p 27017:27017 -v practice_check --name check_mongo --network checknetwork mongo  -> create mongo container

docker run -p 3000:3000 --network checknetwork checkdocker  -> create express container

