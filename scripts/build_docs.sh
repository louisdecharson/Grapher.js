#!/bin/bash

echo "Build HTML documentation"
documentation build dist/grapher.js -f html -o docs -g -t node_modules/documentation-theme-light

echo "Add documentation to README.md"
documentation readme dist/grapher.js --section=Documentation

