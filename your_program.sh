#!/bin/sh
#
# Use this script to run your program LOCALLY.
#
# Note: Changing this script WILL NOT affect how CodeCrafters runs your program.


set -e # Exit early if any commands fail


exec node app/main.js "$@"
