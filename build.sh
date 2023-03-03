#!/bin/bash

docker build -t testtask .
docker tag testtask:latest 648281165308.dkr.ecr.us-east-1.amazonaws.com/testtask:latest
