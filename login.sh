#!/bin/bash

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 648281165308.dkr.ecr.us-east-1.amazonaws.com
