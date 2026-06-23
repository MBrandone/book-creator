FROM ubuntu:latest
LABEL authors="brandone.martins"

ENTRYPOINT ["top", "-b"]