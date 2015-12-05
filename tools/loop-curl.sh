#!/bin/bash
# For testing requests in a tight loop

while true
do
	curl http://localhost:9000/api/v1/pandoc\?url\=http://localhost:8080/README.md
done
