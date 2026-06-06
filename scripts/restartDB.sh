docker compose stop database && 
docker compose rm -f database && 
docker volume rm load-testing-platform_db_data && 
docker compose up database -d