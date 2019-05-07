#!/bin/bash

echo "Starting dependency API"
exec gunicorn dependencyapi.wsgi:application --bind 0.0.0.0:8000
