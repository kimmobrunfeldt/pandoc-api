# Pandoc API

> HTTP API for [Pandoc](http://pandoc.org/) - a universal document converter

**Shortcuts**

* [API documentation](docs/api.md)

## Developer documentation

Documentation for developers.

### Tech stack

* NodeJS

    The web API layer.

* Redis

    [bull](https://github.com/OptimalBits/bull) as a message queue.

* Pandoc

    Worker.

* [Google Cloud Storage](https://cloud.google.com/storage/)

    File storage. Data is shared here between API layer and worker.

## Compiling Pandoc

* Install Vagrant Ubuntu box `vagrant init ubuntu/precise64`
* `vagrant up`
* Increase RAM to 4096MB and give more processor power for the box

    `cabal` [needs more memory](https://github.com/haskell/cabal/issues/2040) than
    512MB.

    You can try with less memory.

* `vagrant ssh`

Inside the box:

* [Install Haskell platform](https://www.haskell.org/downloads/linux)
* `sudo apt-get install libghc-zlib-dev`

    Needed in pandoc installation via `cabal`

*
