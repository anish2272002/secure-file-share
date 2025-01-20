# Backend Dockerfile
FROM python:3.11.3

WORKDIR /project

# set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get upgrade -y

# update pip, install dependencies
RUN pip install --upgrade pip 
COPY ./requirements.txt .
RUN pip install -r requirements.txt

# copy app folder
COPY . .

RUN chmod -R +x /project/scripts

ENV PATH="/project/scripts:$PATH"
EXPOSE 8000

CMD ["/project/scripts/run.sh"]