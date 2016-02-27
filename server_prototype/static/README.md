# Development Setup

1. Make sure you have Node.js and NPM installed.
2. Initialize the submodules:

        git submodule init
        git submodule update

  This will take a while.
3. Install the dev dependencies:

        npm install

4. Fire up the TypeScript compiler:

        ./node_modules/.bin/tsc --pretty --watch

  This will auto-recompile when something is changed.
5. In another shell, fire up a dev server:

        python2 -m SimpleHTTPServer 8000

6. Visit localhost:8000
