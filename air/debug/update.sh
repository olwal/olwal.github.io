#!/bin/bash
cp ../../../air/js/*.js js/
cp ../../../air/index.htm .


git status

read -n1 -r -p 'Press any key to continue' key
git commit -a -m "Latest 3D visualization"
git push
